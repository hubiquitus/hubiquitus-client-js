/*
 * Copyright (c) Novedia Group 2012.
 *
 *     This file is part of Hubiquitus.
 *
 *     Hubiquitus is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     Hubiquitus is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with Hubiquitus.  If not, see <http://www.gnu.org/licenses/>.
 */

//Make it compatible with node and web browser
if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(
    ['./lib/transports/bosh/hsession-bosh', './lib/transports/socketio/hsession-socketio',
        './lib/options', './lib/codes'],
    function(hSessionBosh, hSessionSocketIO, createOptions, codes){

        /**
         * Creates a new client that manages a connection and connects to the
         * hNode Server.
         * @param publisher- username to login to the server
         * @param password - password to login with
         * @param hCallback - function that receives status/msg sent by the server.
         * @param hOptions - Object with configuration settings. See lib/options.js
         */
        var HubiquitusClient = function(){
            this.options = {};
        };

        HubiquitusClient.prototype = {
            connect : function(publisher, password, hCallback, hOptions){
                if(this.transport){
                    var currentStatus = this.transport.status;
                    var code = currentStatus == codes.statuses.CONNECTED ?
                        codes.errors.ALREADY_CONNECTED : codes.errors.CONN_PROGRESS;

                    if(currentStatus == codes.statuses.CONNECTED ||
                        currentStatus == codes.statuses.CONNECTING){
                        this.options.hCallback({
                            type: codes.types.hStatus,
                            data : {
                                status: currentStatus,
                                errorCode: code
                            }
                        });
                        return;
                    }else if(this.transport.errorCode != codes.errors.NO_ERROR){
                        //If error in current transport, disconnect it first.
                        //Unless it's because it's already connected (mainly for socketio)
                        this.disconnect();
                    }
                }

                //Verify if Callback exists
                if(!hCallback) return;

                this.publisher = publisher;
                this.options = createOptions.hub_options(hOptions || {});
                this.options.publisher = publisher;
                this.options.password = password;
                this.options.hCallback = hCallback;

                //Verify JID format (must be a@b)
                var jid = publisher.split('@');
                if(jid.length != 2 || !jid[0] || !jid[1]){
                    hCallback({
                        type: codes.types.hStatus,
                        data : {
                            status: codes.statuses.DISCONNECTED,
                            errorCode: codes.errors.JID_MALFORMAT
                        }
                    });
                    return;
                }

                //Load Balancing
                var endpoints = this.options.endpoints;
                this.options.endpoint =
                    endpoints[Math.floor(Math.random()*endpoints.length)];

                //Instantiate correct transport
                if(this.options.transport == 'bosh'){
                    this.transport = new hSessionBosh.hSessionBosh(this.options);
                }else if(this.options.transport =='socketio'){
                    this.transport = new hSessionSocketIO.hSessionSocketIO(this.options);
                }else{
                    console.error("No transport selected");
                    return;
                }

                //Establish the connection
                this.transport.connect();
            },
            disconnect : function(){
                if(this.transport)
                    this.transport.disconnect();
                delete this.transport;
            },
            subscribe : function(channel){
                if(this._checkConnected())
                    this.transport.subscribe(channel);
            },
            unsubscribe : function(channel){
                if(this._checkConnected())
                    this.transport.unsubscribe(channel);
            },
            publish : function(channel, hMessage){
                if(this._checkConnected())
                    this.transport.publish(channel,hMessage);
            },
            getMessages: function(channel){
                if(this._checkConnected())
                    this.transport.getMessages(channel);
            },
            sendhCommand: function(hCommand){
                if(this._checkConnected()){
                    //Complete hCommand
                    hCommand = this.hCommandBuilder(hCommand);
                    //Send it to transport
                    this.transport.sendhCommand(hCommand);
                    return hCommand.reqid;
                }
            },
            hCommandBuilder: function(hCommand){
                if(this._checkConnected()){
                    hCommand = hCommand || {};
                    hCommand.reqid = hCommand.reqid || 'jscommand' + Math.floor(Math.random()*100001);
                    hCommand.sender = hCommand.sender || this.publisher;
                    hCommand.sent = hCommand.sent || new Date();
                    return hCommand;
                }
            },
            _checkConnected: function(){
                if(this.transport && this.transport.status == codes.statuses.CONNECTED)
                    return true;

                if(this.options.hCallback){
                    var currentStatus = this.transport ? this.transport.status : codes.statuses.DISCONNECTED;
                    var code = currentStatus == codes.statuses.DISCONNECTED ?
                        codes.errors.NOT_CONNECTED : codes.errors.CONN_PROGRESS;
                    this.options.hCallback({
                        type: codes.types.hStatus,
                        data : {
                            status: currentStatus,
                            errorCode: code
                        }
                    });
                }
                return false;
            },
            errors: codes.errors,
            status: codes.statuses
        };

        if(typeof module !== 'undefined' && module.exports){
            //Entrypoint to hClient in Node mode
            exports.hClient = new HubiquitusClient();
        }else{
            //Global entrypoint to hClient in Browser mode
            hClient = new HubiquitusClient();
        }
    }
);

