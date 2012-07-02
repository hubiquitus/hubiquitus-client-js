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

        var statuses = codes.statuses;
        var errors = codes.errors;

        /**
         * Creates a new client that manages a connection and connects to the
         * hNode Server.
         */
        var HubiquitusClient = function(){
            this.onStatus = function(hStatus){};
            this.onMessage = function(hMessage){};

            this.openCmds = {};
            this.status = statuses.DISCONNECTED;
        };

        HubiquitusClient.prototype = {
            connect : function(publisher, password, hOptions){
                var code = this.status == statuses.CONNECTED || this.status == statuses.REATTACHED ?
                    errors.ALREADY_CONNECTED : errors.CONN_PROGRESS;

                if( this.status == statuses.CONNECTED || this.status == statuses.CONNECTING ||
                    this.status == statuses.REATTACHED || this.status == statuses.REATTACHING){
                    this.onStatus({
                        status: this.status,
                        errorCode: code
                    });
                    return;
                }

                this.hOptions = createOptions.hub_options(hOptions || {});

                var transportCB = function(type, value){
                    //'this' is correct because of the bind
                    switch(type){
                        case 'hStatus':
                            this.status = value.status;
                            this.onStatus(value);
                            break;
                        case 'hMessage':
                            this.onMessage(value);
                            break;
                        case 'hResult':
                            var cmdCB = this.openCmds[value.reqid];
                            delete this.openCmds[value.reqid];
                            if(cmdCB)
                                cmdCB(value);
                    }
                };

                if(!this.checkJID(publisher))
                    return this.onStatus({
                        status: codes.statuses.DISCONNECTED,
                        errorCode: codes.errors.JID_MALFORMAT
                    });

                //Set Domain and publisher
                this.domain = this.splitJID(publisher)[1];
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

            subscribe : function(channel, cb){
                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hSubscribe',
                    params: {chid: channel}
                };
                this.command(hCommand, cb);
            },

            unsubscribe : function(channel, cb){
                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hUnsubscribe',
                    params: {chid: channel}
                };
                this.command(hCommand, cb);
            },

            publish : function(hMessage, cb){
                if(hMessage instanceof Object)
                    hMessage.publisher = this.publisher;

                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hPublish',
                    params: hMessage
                };
                this.command(hCommand, cb);
            },

            getSubscriptions: function(cb){
                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hGetSubscriptions'
                };
                this.command(hCommand, cb);
            },

            getLastMessages: function(chid, quantity, cb){
                //Allow not to specify quantity and pass a callback directly
                if(typeof quantity === 'function'){ cb = quantity; quantity = undefined; }

                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hGetLastMessages',
                    params: {
                        chid: chid,
                        nbLastMsg: quantity
                    }
                };
                this.command(hCommand, cb);
            },

            getThread: function(chid, convid, cb){
                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hGetThread',
                    params: {
                        chid: chid,
                        convid: convid
                    }
                };
                this.command(hCommand, cb);
            },

            getThreads: function(chid, status, cb){
                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hGetThreads',
                    params: {
                        chid: chid,
                        status: status
                    }
                };
                this.command(hCommand, cb);
            },

            setFilter: function(filter, cb){
                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hSetFilter',
                    params: filter
                };
                this.command(hCommand, cb);
            },

            unsetFilter: function(name, chid, cb){
                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hUnsetFilter',
                    params: {name: name, chid: chid}
                };
                this.command(hCommand, cb);
            },

            listFilters: function(chid, cb){
                //Allow not to specify chid and pass a callback directly
                if(typeof chid === 'function'){ cb = chid; chid = undefined; }

                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hListFilters',
                    params: {chid: chid}
                };
                this.command(hCommand, cb);
            },

            getRelevantMessages: function(chid, cb){
                var hCommand = {
                    entity: this.hOptions.hServer + '@' + this.domain,
                    cmd: 'hRelevantMessages',
                    params: {chid: chid}
                };
                this.command(hCommand, cb);
            },

            command: function(hCommand, cb){
                //Complete hCommand
                hCommand = this.commandBuilder(hCommand);
                var errorCode = undefined;
                var errorMsg = undefined;

                //Verify if well formatted
                if(!hCommand.entity){
                    errorCode = codes.hResultStatus.MISSING_ATTR;
                    errorMsg = 'the entity attribute is missing';
                } else if(!hCommand.cmd){
                    errorCode = codes.hResultStatus.MISSING_ATTR;
                    errorMsg = 'the cmd attribute is missing';
                } else if(this.status != statuses.CONNECTED && this.status != statuses.REATTACHED){
                    errorCode = codes.hResultStatus.NOT_CONNECTED;
                    errorMsg = 'client not connected, cannot send command';
                }

                if(!errorCode){
                    //Add it to the open commands to call cb later
                    this.openCmds[hCommand.reqid] = cb;

                    //Send it to transport
                    this.transport.sendhCommand(hCommand);
                } else if(cb)
                    cb({
                        cmd : hCommand.cmd,
                        reqid : hCommand.reqid,
                        status : errorCode,
                        result : errorMsg
                    });
            },

            commandBuilder: function(hCommand){
                hCommand = hCommand || {};
                hCommand.reqid = hCommand.reqid || 'jscommand' + Math.floor(Math.random()*100001);
                hCommand.sender = hCommand.sender || this.publisher;
                hCommand.sent = hCommand.sent || new Date();

                return hCommand;
            },

            buildMessage: function(chid, type, payload, options){
                options = options || {};

                if(!chid)
                    throw new Error('missing chid');

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
                    headers: options.headers,
                    payload: payload
                };
            },

            buildMeasure: function(chid, value, unit, options){
                if(!value)
                    throw new Error('missing value');
                else if (!unit)
                    throw new Error('missing unit');

                return this.buildMessage(chid, 'hMeasure', {unit: unit, value: value}, options);
            },

            buildAlert: function(chid, alert, options){
                if(!alert)
                    throw new Error('missing alert');

                return this.buildMessage(chid, 'hAlert', {alert: alert}, options);
            },

            buildAck: function(chid, ackid, ack, options){
                if(!ackid)
                    throw new Error('missing ackid');
                else if(!ack)
                    throw new Error('missing ack');
                else if(!/recv|read/i.test(ack))
                    throw new Error('ack does not match "recv" or "read"');
                else if(!options || !options.convid)
                    throw new Error('missing convid in options');

                return this.buildMessage(chid, 'hAck', {ackid: ackid, ack: ack}, options);
            },

            buildConvState: function(chid, convid, status, options){
                if(!convid)
                    throw new Error('missing convid');
                else if(!status)
                    throw new Error('missing status');
                if(!options)
                    options = {};

                options.convid = convid;

                return this.buildMessage(chid, 'hConvState', {status: status}, options);
            },

            checkJID: function(jid){
                return new RegExp("^(?:([^@/<>'\"]+)@)([^@/<>'\"]+)(?:/([^/<>'\"]*))?$").test(jid);
            },

            splitJID: function(jid){
                return jid.match(new RegExp("^(?:([^@/<>'\"]+)@)([^@/<>'\"]+)(?:/([^/<>'\"]*))?$")).splice(1, 3);
            },

            errors: codes.errors,
            statuses: codes.statuses,
            hResultStatus: codes.hResultStatus
        };

        if(typeof module !== 'undefined' && module.exports){
            //Entrypoint to hClient in Node mode
            exports.hClient = new HubiquitusClient();
            exports.HubiquitusClient = HubiquitusClient; //Allow access to constructor (used with stress option)
            exports.statuses = codes.statuses;
            exports.hResultStatus = codes.hResultStatus;
        }else{
            //Global entrypoint to hClient in Browser mode
            hClient = new HubiquitusClient();
        }
    }
);

