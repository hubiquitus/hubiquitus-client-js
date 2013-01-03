/*
 * Copyright (c) Novedia Group 2012.
 *
 *    This file is part of Hubiquitus
 *
 *    Permission is hereby granted, free of charge, to any person obtaining a copy
 *    of this software and associated documentation files (the "Software"), to deal
 *    in the Software without restriction, including without limitation the rights
 *    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 *    of the Software, and to permit persons to whom the Software is furnished to do so,
 *    subject to the following conditions:
 *
 *    The above copyright notice and this permission notice shall be included in all copies
 *    or substantial portions of the Software.
 *
 *    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 *    INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 *    PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 *    FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 *    ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *    You should have received a copy of the MIT License along with Hubiquitus.
 *    If not, see <http://opensource.org/licenses/mit-license.php>.
 */

//Make it compatible with node and web browser
if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(
    ['./lib/transports/socketio/hsession-socketio',
        './lib/options', './lib/codes'],
    function(hSessionSocketIO, createOptions, codes){

        var statuses = codes.statuses;
        var errors = codes.errors;
        var hResultStatus = codes.hResultStatus;

        /**
         * Creates a new client that manages a connection and connects to the
         * hNode Server.
         */
        var HubiquitusClient = function(){
            this.onStatus = function(hStatus){};
            this.onMessage = function(hMessage){};

            this.msgToBeAnswered = {};
            this.status = statuses.DISCONNECTED;
        };

        HubiquitusClient.prototype = {
            connect : function(publisher, password, hOptions){
                var code = this.status == statuses.CONNECTED ?
                    errors.ALREADY_CONNECTED : errors.CONN_PROGRESS;

                if( this.status == statuses.CONNECTED || this.status == statuses.CONNECTING){
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
                            if((value.status !== statuses.CONNECTED) || (value.status !== statuses.CONNECTED && this.fulljid !== undefined)){
                                this.status = value.status;
                                this.onStatus(value);
                            }
                            break;
                        case 'hMessage':
                            this.onMessageInternal(value);
                            break;
                        case 'attrs':
                            this.fulljid = value.publisher;
                            this.ressource = this.fulljid.replace(/^.*\//, "")
                            this.serverDomain = value.serverDomain;
                            if(this.status !== statuses.CONNECTED)
                            {
                                this.status = statuses.CONNECTED;
                                this.onStatus({
                                    status:statuses.CONNECTED,
                                    errorCode: errors.NO_ERROR
                                });
                            }
                    }
                };

                if(!this.checkURN(publisher))
                    return this.onStatus({
                        status: codes.statuses.DISCONNECTED,
                        errorCode: codes.errors.URN_MALFORMAT
                    });

                //Set Domain and publisher
                this.domain = this.splitURN(publisher)[1];
                this.publisher = publisher;

                //Load Balancing
                var endpoints = this.hOptions.endpoints;
                this.hOptions.endpoint =
                    endpoints[Math.floor(Math.random()*endpoints.length)];

                //Instantiate correct transport
                var self = this;
                switch(this.hOptions.transport){
                    default:
                        this.transport = new hSessionSocketIO.hSessionSocketIO(publisher, password, function(type, value) {transportCB.call(self, type, value)}, this.hOptions);
                }

                //Establish the connection
                this.transport.connect(publisher);
            },

            onMessageInternal : function(hMessage) {
                var ref;
                if (hMessage && hMessage.ref && typeof hMessage.ref === 'string')
                    ref = hMessage.ref.split("#")[0];

                if (ref)
                    var cb = this.msgToBeAnswered[ref];

                if (cb) {
                    delete this.msgToBeAnswered[ref];
                    cb(hMessage);
                } else
                    this.onMessage(hMessage);
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

            subscribe : function(actor, cb){
                if(!actor && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing actor"));
                var hMessage = this.buildCommand(actor, 'hSubscribe');
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            unsubscribe : function(actor, cb){
                if(!actor && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing actor"));
                var hMessage = this.buildCommand(actor, 'hUnsubscribe');
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            send : function(hMessage, cb){
                if(!(hMessage instanceof Object))
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "provided hMessage should be an object"));

                hMessage.publisher = this.fulljid;
                hMessage.msgid = UUID.generate();
                hMessage.published = hMessage.published || new Date();
                hMessage.sent = new Date();

                //Complete hCommand
                var errorCode = undefined;
                var errorMsg = undefined;

                //Verify if well formatted
                if(!hMessage.actor){
                    errorCode = codes.hResultStatus.MISSING_ATTR;
                    errorMsg = 'the actor attribute is missing';
                }else if(this.status != statuses.CONNECTED){
                    errorCode = codes.hResultStatus.NOT_CONNECTED;
                    errorMsg = 'client not connected, cannot send command';
                }

                if(!errorCode){
                    //if there is a callback and no timeout, timeout is set to default value of 30s
                    //Add it to the open message to call cb later
                    if(cb) {
                        if(hMessage.timeout > 0){
                            this.msgToBeAnswered[hMessage.msgid] = cb;
                            var timeout = hMessage.timeout;
                            var self = this;
                            //if no response in time we call a timeout
                            setInterval(function(){
                                if(self.msgToBeAnswered[hMessage.msgid]) {
                                    delete self.msgToBeAnswered[hMessage.msgid];
                                    if(hMessage.payload && typeof hMessage.payload === 'object')
                                        cmd = hMessage.payload.cmd;
                                    var errCode = codes.hResultStatus.EXEC_TIMEOUT;
                                    var errMsg = 'No response was received within the ' + timeout + ' timeout';
                                    var resultMsg = self.buildResult(hMessage.publisher, hMessage.msgid, errCode, errMsg);
                                    cb(resultMsg);
                                }
                            },timeout);
                        }
                        else
                            hMessage.timeout = 0;
                    }
                    else
                        hMessage.timeout = 0;

                    //Send it to transport
                    this.transport.sendhMessage(hMessage);
                } else if(cb) {
                    var cmd;
                    if(hMessage.payload && typeof hMessage.payload === 'string')
                        cmd = hMessage.payload.cmd;
                    var actor = hMessage.actor || 'Unknown';
                    var resultMsg = this.buildResult(actor, hMessage.msgid, errorCode, errorMsg);
                    cb(resultMsg);
                }
            },

            getSubscriptions: function(cb){
                var hMessage = this.buildCommand('hnode@' + this.serverDomain, 'hGetSubscriptions');
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            getLastMessages: function(actor, quantity, cb){
                if(!actor && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing actor"));
                //Allow not to specify quantity and pass a callback directly
                if(typeof quantity === 'function'){ cb = quantity; quantity = undefined; }

                var hMessage = this.buildCommand(actor, 'hGetLastMessages', {nbLastMsg: quantity});
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            getThread: function(actor, convid, cb, sort){
                if(!actor && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing actor"));
                if(!convid && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing convid"));
                var hMessage = this.buildCommand(actor, 'hGetThread', {convid: convid, sort: sort});
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            getThreads: function(actor, status, cb){
                if(!actor && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing actor"));
                if(!status && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing status"));
                var hMessage = this.buildCommand(actor, 'hGetThreads', {status: status});
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            setFilter: function(filter, cb){
                if(!filter && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing filter"));
                var hMessage = this.buildCommand(this.fulljid, 'hSetFilter', filter);
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            getRelevantMessages: function(actor, cb){
                if(!actor && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing actor"));
                var hMessage = this.buildCommand(actor, 'hRelevantMessages');
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            buildCommand: function(actor, cmd, params, options){
                params = params || {};
                options = options || {};
                if(!cmd)
                    throw new Error('missing cmd');

                var hCommand = {cmd: cmd, params:params};
                return this.buildMessage(actor, 'hCommand', hCommand, options);
            },

            buildResult: function(actor, ref, status, result, options) {
                options = options || {};
                if(status === undefined || status === null)
                    throw new Error('missing status');

                if(!ref)
                    throw new Error('missing ref');

                var hResult = {status: status, result: result};
                options.ref = ref;
                return this.buildMessage(actor, 'hResult', hResult, options);
            },

            buildMessage: function(actor, type, payload, options){
                options = options || {};

                if(!actor)
                    throw new Error('missing actor');

                var hMessage = {};
                hMessage.actor = actor;

                if(options.ref)
                    hMessage.ref = options.ref;

                if(options.convid)
                    hMessage.convid = options.convid;

                if(type)
                    hMessage.type = type;

                if(options.priority)
                    hMessage.priority = options.priority;

                if(options.relevance)
                    hMessage.relevance = options.relevance;

                if(options.relevanceOffset){
                    var currentDate = new Date();
                    hMessage.relevance = new Date(currentDate.getTime() + options.relevanceOffset)
                }

                if(options.persistent !== null || options.persistent !== undefined)
                    hMessage.persistent = options.persistent;

                if(options.location)
                    hMessage.location = options.location;

                if(options.author)
                    hMessage.author = options.author;

                if(options.published)
                    hMessage.published = options.published;

                if(options.headers)
                    hMessage.headers = options.headers;

                if(payload)
                    hMessage.payload = payload;

                if(options.timeout)
                    hMessage.timeout = options.timeout;

                return hMessage;
            },

            buildMeasure: function(actor, value, unit, options){
                if(!value)
                    throw new Error('missing value');
                else if (!unit)
                    throw new Error('missing unit');

                return this.buildMessage(actor, 'hMeasure', {unit: unit, value: value}, options);
            },

            buildAlert: function(actor, alert, options){
                if(!alert)
                    throw new Error('missing alert');

                return this.buildMessage(actor, 'hAlert', {alert: alert}, options);
            },

            buildAck: function(actor, ref, ack, options){
                if(!ack)
                    throw new Error('missing ack');
                if(!ref)
                    throw new Error('missing ref');
                else if(!/recv|read/i.test(ack))
                    throw new Error('ack does not match "recv" or "read"');
                if(typeof  options !== 'object')
                    options = {};

                options.ref = ref;
                return this.buildMessage(actor, 'hAck', {ack: ack}, options);
            },

            buildConvState: function(actor, convid, status, options){
                if(!convid)
                    throw new Error('missing convid');
                else if(!status)
                    throw new Error('missing status');
                if(!options)
                    options = {};

                options.convid = convid;

                return this.buildMessage(actor, 'hConvState', {status: status}, options);
            },

            checkURN: function(urn){
                return /(^urn:[^:\/<>'"]+:[^:\/<>'"]+\/?.+$)/.test(urn);
            },

            splitURN: function(urn){
                return urn.split(":").splice(1, 3);
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

function UUID(){}UUID.generate=function(){var a=UUID._gri,b=UUID._ha;return b(a(32),8)+"-"+b(a(16),4)+"-"+b(16384|a(12),4)+"-"+b(32768|a(14),4)+"-"+b(a(48),12)};UUID._gri=function(a){return 0>a?NaN:30>=a?0|Math.random()*(1<<a):53>=a?(0|1073741824*Math.random())+1073741824*(0|Math.random()*(1<<a-30)):NaN};UUID._ha=function(a,b){for(var c=a.toString(16),d=b-c.length,e="0";0<d;d>>>=1,e+=e)d&1&&(c=e+c);return c};

