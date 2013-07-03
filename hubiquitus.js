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
if (typeof define !== 'function') { var define = require('amdefine')(module); }


define(
    ['./lib/transports/socketio/hsession-socketio',
        './lib/options', './lib/codes'],
    function(hSessionSocketIO, createOptions, codes){

        var statuses = codes.statuses;
        var errors = codes.errors;
        var hResultStatus = codes.hResultStatus;

        /**
         * Creates a new client that manages a connection and connects to the
         * gateway.
         */
        var HubiquitusClient = function(){
            this.onStatus = function(hStatus){};
            this.onMessage = function(hMessage){};

            this.msgToBeAnswered = {};
            this.status = statuses.DISCONNECTED;
            this.hOptions = createOptions.hub_options({});
        };

        HubiquitusClient.prototype = {
            connect : function(login, password, hOptions, context){
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
                            if((value.status !== statuses.CONNECTED) || (value.status !== statuses.CONNECTED && this.fullurn !== undefined)){
                                this.status = value.status;
                                this.onStatus(value);
                            }
                            break;
                        case 'hMessage':
                            this.onMessageInternal(value);
                            break;
                        case 'attrs':
                            this.fullurn = value.publisher;
                            this.resource = this.fullurn.replace(/^.*\//, "")

                            if(this.status !== statuses.CONNECTED)
                            {
                                this.status = statuses.CONNECTED;
                                this.onStatus({
                                    status:statuses.CONNECTED,
                                    errorCode: errors.NO_ERROR
                                });
                            }
                            //Set Domain and publisher
                            this.domain = this.splitURN(this.fullurn)[0];
                            this.publisher = this.bareURN(this.fullurn);
                    }
                };



                //Load Balancing
                var endpoints = this.hOptions.endpoints;
                this.hOptions.endpoint =
                    endpoints[Math.floor(Math.random()*endpoints.length)];

                //Instantiate correct transport
                var self = this;
                switch(this.hOptions.transport){
                    default:
                        this.transport = new hSessionSocketIO.hSessionSocketIO(login, password, context, function(type, value) {transportCB.call(self, type, value)}, this.hOptions);
                }

                //Establish the connection
                this.transport.connect(login);
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
                var hMessage = this.buildCommand("session", 'hUnsubscribe', {channel:actor});
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            send : function(hMessage, cb){
                if(!(hMessage instanceof Object))
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "provided hMessage should be an object"));

                var now = (new Date()).getTime();
                hMessage.publisher = this.fullurn;
                hMessage.msgid = UUID.generate();
                hMessage.published = hMessage.published || now;
                hMessage.sent = now;

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
                    if(typeof this.transport !== 'undefined')
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
                var hMessage = this.buildCommand("session", 'hGetSubscriptions');
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.send(hMessage, cb);
            },

            setFilter: function(filter, cb){
                if(!filter && cb)
                    return cb(this.buildResult("Unkonwn", "Unknown", hResultStatus.MISSING_ATTR, "Missing filter"));
                var hMessage = this.buildCommand("session", 'hSetFilter', filter);
                if(hMessage.timeout === undefined)
                    hMessage.timeout = this.hOptions.msgTimeout
                this.filter = filter
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
                    hMessage.relevance = (new Date()).getTime() + options.relevanceOffset
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

            validateFullURN: function(urn) {
                return /(^urn:[a-zA-Z0-9]{1}[a-zA-Z0-9\-.]+:[a-zA-Z0-9_,=@;!'%/#\(\)\+\-\.\$\*\?]+\/.+$)/.test(urn);
            },

            splitURN:function(urn) {
                var splitted;

                if (typeof urn === "string") {
                    splitted = urn.split(":");
                }
                if (splitted) {
                    if (this.validateFullURN(urn)) {
                        splitted[3] = splitted[2].replace(/(^[^\/]*\/)/, "");
                        splitted[2] = splitted[2].replace(/\/.*$/g, "");
                    }
                    return splitted.splice(1, 3);
                } else {
                    return [undefined, undefined, undefined];
                }
            },

            getBareURN: function(urn) {
                var urnParts;

                urnParts = this.splitURN(urn);
                return "urn:" + urnParts[0] + ":" + urnParts[1];
            },

            // Deprecated : This function is here for retro compatiblity.
            bareURN: function(urn) {
                var urnParts;

                urnParts = this.splitURN(urn);
                return "urn:" + urnParts[0] + ":" + urnParts[1];
            },

            errors: codes.errors,
            statuses: codes.statuses,
            hResultStatus: codes.hResultStatus
        };

        if(typeof module !== 'undefined' && module.exports){
            //Entrypoint to hClient in Node mode
            exports.HClient = HubiquitusClient; //Allow access to constructor
            exports.statuses = codes.statuses;
            exports.hResultStatus = codes.hResultStatus;
            exports.codes = codes;
        }else{
            //Global entrypoint to hClient in Browser mode
            hClient = new HubiquitusClient(); // Deprecated. Should be removed in next releases
            return HubiquitusClient;
        }
    }
);

function UUID(){}UUID.generate=function(){var a=UUID._gri,b=UUID._ha;return b(a(32),8)+"-"+b(a(16),4)+"-"+b(16384|a(12),4)+"-"+b(32768|a(14),4)+"-"+b(a(48),12)};UUID._gri=function(a){return 0>a?NaN:30>=a?0|Math.random()*(1<<a):53>=a?(0|1073741824*Math.random())+1073741824*(0|Math.random()*(1<<a-30)):NaN};UUID._ha=function(a,b){for(var c=a.toString(16),d=b-c.length,e="0";0<d;d>>>=1,e+=e)d&1&&(c=e+c);return c};
