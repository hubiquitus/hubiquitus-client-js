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
         */
        var HubiquitusClient = function(){
            this.onStatus = function(hStatus){};
            this.onMessage = function(hMessage){};
        };

        HubiquitusClient.prototype = {
            connect : function(publisher, password, hOptions){
                if(this.transport){
                    var currentStatus = this.transport.status;
                    var code = currentStatus == codes.statuses.CONNECTED || currentStatus == codes.statuses.REATTACHED ?
                        codes.errors.ALREADY_CONNECTED : codes.errors.CONN_PROGRESS;

                    if(currentStatus == codes.statuses.CONNECTED ||
                        currentStatus == codes.statuses.CONNECTING ||
                        currentStatus == codes.statuses.REATTACHED ||
                        currentStatus == codes.statuses.REATTACHING){
                        this.onStatus({
                            status: currentStatus,
                            errorCode: code
                        });
                        return;
                    }else if(this.transport.errorCode != codes.errors.NO_ERROR){
                        //If error in current transport, disconnect it first.
                        //Unless it's because it's already connected (mainly for socketio)
                        this.disconnect();
                    }
                }

                this.hOptions = createOptions.hub_options(hOptions || {});
                var transportCB = function(type,value){
                    console.log('type', type, 'value', value);
                    switch(type){
                        case 'hStatus':
                            this.onStatus(value); //'this' is correct because of the bind
                            break;
                        case 'hMessage':
                            this.onMessage(value);
                            break;
                        case 'hResult':
                        //TODO
                    }
                };


                //Verify JID format (must be a@b)
                var jid = publisher.split('@');
                if(jid.length != 2 || !jid[0] || !jid[1]){
                    this.onStatus({
                        status: codes.statuses.DISCONNECTED,
                        errorCode: codes.errors.JID_MALFORMAT
                    });
                    return;
                }

                //Set Domain and publisher
                this.domain = jid[1];
                this.publisher = publisher;

                //Load Balancing
                var endpoints = this.hOptions.endpoints;
                this.hOptions.endpoint =
                    endpoints[Math.floor(Math.random()*endpoints.length)];

                //Instantiate correct transport
                switch(this.hOptions.transport){
                    case 'bosh':
                        this.transport = new hSessionBosh.hSessionBosh(publisher, password, transportCB.bind(this), this.hOptions);
                        break;
                    default:
                        this.transport = new hSessionSocketIO.hSessionSocketIO(publisher, password, transportCB.bind(this), this.hOptions);
                }

                //Establish the connection
                this.transport.connect();
            },

            disconnect : function(){
                if(this.transport){
                    this.transport.disconnect();
                    delete this.transport;
                }else{
                    this.onStatus({
                        status: codes.statuses.DISCONNECTED,
                        errorCode: codes.errors.NOT_CONNECTED
                    });
                }
            },

            subscribe : function(channel){
                var hCommand = {
                    entity: this.hOptions.hServer + '.' + this.domain,
                    cmd: 'hSubscribe',
                    params: {chid: channel}
                };
                return this.command(hCommand);
            },

            unsubscribe : function(channel){
                var hCommand = {
                    entity: this.hOptions.hServer + '.' + this.domain,
                    cmd: 'hUnsubscribe',
                    params: {chid: channel}
                };
                return this.command(hCommand);
            },

            publish : function(hMessage){
                var hCommand = {
                    entity: this.hOptions.hServer + '.' + this.domain,
                    cmd: 'hPublish',
                    params: hMessage
                };
                return this.command(hCommand);
            },

            getSubscriptions: function(){
                var hCommand = {
                    entity: this.hOptions.hServer + '.' + this.domain,
                    cmd: 'hGetSubscriptions'
                };
                return this.command(hCommand);
            },

            getLastMessages: function(chid, quantity){
                var hCommand = {
                    entity: this.hOptions.hServer + '.' + this.domain,
                    cmd: 'hGetLastMessages',
                    params: {
                        chid: chid,
                        quant: quantity
                    }
                };
                return this.command(hCommand);
            },

            command: function(hCommand){
                if(this._checkConnected()){
                    //Complete hCommand
                    hCommand = this.commandBuilder(hCommand);
                    var errorCode = undefined;
                    var errorMsg = undefined;
                    //Verify if well formatted
                    if(!hCommand.entity){
                        errorCode = codes.hResultStatus.MISSING_ATTR;
                        errorMsg = 'the attribute entity is missing';
                    } else if(!hCommand.cmd){
                        errorCode = codes.hResultStatus.MISSING_ATTR;
                        errorMsg = 'the attribute cmd is missing';
                    }
                    if(!errorCode){
                        //Send it to transport
                        this.transport.sendhCommand(hCommand);
                        return hCommand.reqid;
                    } else{
//                        this.options.hCallback({
//                            type : codes.types.hResult,
//                            data : {
//                                cmd : hCommand.cmd,
//                                reqid : hCommand.reqid,
//                                status : errorCode,
//                                result : errorMsg
//                            }
//                        })
                    }
                }
            },

            commandBuilder: function(hCommand){
                if(this._checkConnected()){
                    hCommand = hCommand || {};
                    hCommand.reqid = hCommand.reqid || 'jscommand' + Math.floor(Math.random()*100001);
                    hCommand.sender = hCommand.sender || this.publisher;
                    hCommand.sent = hCommand.sent || new Date();
                    return hCommand;
                }
            },

            buildMessage: function(chid, type, payload, options){
                options = options || {};

                if(!chid){
//                    if(this.options.hCallback)
//                        this.options.hCallback({
//                            type : codes.types.hResult,
//                            data : {
//                                cmd : 'hPublish',
//                                status : codes.hResultStatus.MISSING_ATTR,
//                                result : 'missing chid'
//                            }
//                        });
                    return;
                }

                if(this._checkConnected())
                    return {
                        chid: chid,
                        convid: options.convid,
                        type: type,
                        priority: options.priority,
                        relevance: options.relevance,
                        transient: options.transient,
                        location: options.location,
                        author: options.author,
                        published: options.published,
                        publisher: this.publisher,
                        headers: options.headers,
                        payload: payload
                    };
            },

            buildMeasure: function(chid, value, unit, options){

                if(!value || !unit){
//                    if(this.options.hCallback)
//                        this.options.hCallback({
//                            type : codes.types.hResult,
//                            data : {
//                                cmd : 'hPublish',
//                                status : codes.hResultStatus.MISSING_ATTR,
//                                result : 'missing value or unit'
//                            }
//                        });
                    return;
                }

                return this.buildMessage(chid, 'hMeasure', {unit: unit, value: value}, options);
            },

            buildAlert: function(chid, alert, options){
                if(!alert){
//                    if(this.options.hCallback)
//                        this.options.hCallback({
//                            type : codes.types.hResult,
//                            data : {
//                                cmd : 'hPublish',
//                                status : codes.hResultStatus.MISSING_ATTR,
//                                result : 'missing alert'
//                            }
//                        });
                        return;
                }

                return this.buildMessage(chid, 'hAlert', {alert: alert}, options);
            },

            buildAck: function(chid, ackid, ack, options){
                var status = null;
                var result = null;

                if(!ackid || !ack){
                    status = codes.hResultStatus.MISSING_ATTR;
                    result = 'missing ackid or ack';
                }else if(!/recv|read/i.test(ack)){
                    status = codes.hResultStatus.INVALID_ATTR;
                    result = 'ack does not match "recv" or "read"';
                }else if(!options || !options.convid){
                    status = codes.hResultStatus.MISSING_ATTR;
                    result = 'missing convid in options';
                }

                if( status != null ){
//                    if(this.options.hCallback)
//                        this.options.hCallback({
//                            type : codes.types.hResult,
//                            data : {
//                                cmd : 'hPublish',
//                                status: status,
//                                result: result
//                            }
//                        });
                    return;
                }

                return this.buildMessage(chid, 'hAck', {ackid: ackid, ack: ack}, options);
            },

            buildConv: function(chid, topic, participants, options){

                return this.buildMessage(chid, 'hConv', {topic: topic, participants: participants}, options);
            },

            _checkConnected: function(){
                if(this.transport && (this.transport.status == codes.statuses.CONNECTED ||
                    this.transport.status == codes.statuses.REATTACHED))
                    return true;

//                if(this.options.hCallback){
//                    var currentStatus = this.transport ? this.transport.status : codes.statuses.DISCONNECTED;
//                    var code = currentStatus == codes.statuses.DISCONNECTED ?
//                        codes.errors.NOT_CONNECTED : codes.errors.CONN_PROGRESS;
//                    this.options.hCallback({
//                        type: codes.types.hStatus,
//                        data : {
//                            status: currentStatus,
//                            errorCode: code
//                        }
//                    });
//                }
                return false;
            },

            errors: codes.errors,
            status: codes.statuses,
            hResultStatus: codes.hResultStatus
        };

        if(typeof module !== 'undefined' && module.exports){
            //Entrypoint to hClient in Node mode
            exports.hClient = new HubiquitusClient();
            exports.HubiquitusClient = HubiquitusClient; //Allow access to constructor (used with stress option)
            exports.status = codes.statuses;
            exports.hResultStatus = codes.hResultStatus;
        }else{
            //Global entrypoint to hClient in Browser mode
            hClient = new HubiquitusClient();
        }
    }
);

