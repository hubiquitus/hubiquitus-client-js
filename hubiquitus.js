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
         * XMPP Server.
         * @param username - username to login to the server
         * @param password - password to login with
         * @param callback - function that receives status/msg sent by the server.
         * @param options - Object with configuration settings. See lib/options.js
         */
        var HubiquitusClient = function(){
        };

        HubiquitusClient.prototype = {
            connect : function(publisher, password, hCallback, hOptions){
                //Cleanup old connection
                if (this.transport){
                    //Dummy to not call old callback when disconnecting.
                    //Delete can generate errors if a async call was made before disconnecting.
                    this.transport.callback = function(dummy){};
                    this.transport.disconnect();
                }

                //Verify is Callback exists
                if(!hCallback) return;
                //Verify JID format (must be a@b)
                if(publisher.split('@').length != 2){
                    hCallback({
                        context: codes.contexts.hStatus,
                        status: codes.statuses.Error,
                        errorCode: codes.errors.JID_MALFORMAT});
                    return;
                }

                this.options = createOptions.hub_options(hOptions || {});
                this.options.publisher = publisher;
                this.options.password = password;

                //Load Balancing
                var endpoints = this.options.endpoints;
                this.options.endpoint =
                    endpoints[Math.floor(Math.random()*endpoints.length)];

                //Instantiate correct transport
                if(this.options.transport == 'bosh'){
                    this.transport = new hSessionBosh.hSessionBosh(this.options, hCallback);
                }else if(this.options.transport =='socketio'){
                    this.transport = new hSessionSocketIO.hSessionSocketIO(this.options, hCallback);
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
                delete this['transport'];
            },
            subscribe : function(channel){
                if(this.transport)
                    this.transport.subscribe(channel);
            },
            unsubscribe : function(channel){
                if(this.transport)
                    this.transport.unsubscribe(channel);
            },
            publish : function(channel, hMessage){
                if(this.transport)
                    this.transport.publish(channel,hMessage);
            },
            getMessages: function(channel){
                if(this.transport)
                    this.transport.getMessages(channel);
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

