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
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
    ['../../codes', '../../sessionStorage'],
    function(codes, sessionStorageAux){
        var statuses = codes.statuses;
        var errors = codes.errors;
        var types = codes.types;

        //Loading exclusive modules for Node
        if(typeof module !== 'undefined' && module.exports){
            io = require('socket.io-client');
        }

        //Taking care of session Storage. Sometimes the browser doesn't find it
        //And if it's node or we don't have support so we use 'our version'
        if(!sessionStorage){
            if(typeof window !== 'undefined' && window.sessionStorage)
                var sessionStorage = window.sessionStorage;
            else
                var sessionStorage = sessionStorageAux.sessionStorage;
        }

        /**
         * Constructor to establish a connection to the socketIO server.
         * @param opts - Required options to connect
         */
        var hSessionSocketIO = function(opts){
            this.params = opts;
            this.callback = opts.hCallback;
            this.retryIntervals = opts.retryIntervals;
            this.rid = 0;
            this.status = statuses.DISCONNECTED;
            this.errorCode = undefined;
        };

        /**
         * Connects to the gateway by using a new connection or by attaching
         * to an existing one and starts listening for events.
         * This sets a timer for the connection. If the timeout expires we send a CONNECTION_TIMEOUT
         * @options - Options to establish the socket
         */
        hSessionSocketIO.prototype.connect = function(){
            var self = this;
            var re = new RegExp(this.params.publisher,"i");
            //If we have information stored, and not of the same user, send error.
            if(typeof sessionStorage.getItem('publisher') === 'string' &&
                sessionStorage.getItem('publisher').search(re) == -1){
                this.on_status({status: statuses.ERROR, errorCode: errors.ALREADY_CONNECTED});
                return;
            }

            var on_socket = function(){
                self.addListeners();
                if(typeof sessionStorage.getItem('publisher') === 'string'){
                    //If we have information stored use it
                    self.on_status({status: statuses.REATTACHING});
                    self.socket.emit('attach', {
                        publisher: sessionStorage.getItem('publisher'),
                        rid: sessionStorage.getItem('rid'),
                        sid: sessionStorage.getItem('sid')});
                }else{
                    //Start a new connection
                    self.on_status({status: statuses.CONNECTING});
                    self.socket.emit('hConnect', {
                        publisher: self.params.publisher,
                        password: self.params.password,
                        serverHost: self.params.serverHost,
                        serverPort: self.params.serverPort
                    });
                }
            };

            //Wait before returning error in connection
            this.connect_timeout = setTimeout(function(){
                self.on_status.call(self,{status: statuses.ERROR, errorCode: errors.CONN_TIMEOUT})
            }, self.params.timeout * 1000);

            //When reconnecting, the socket exists, we just need to attach or connect to XMPP
            //FIXME: this test in browser doesn't work
            if( this.socket ){
                on_socket();
                return;
            }

            this.socket = io.connect(this.params.endpoint, {'force new connection': true});
            this.socket.on('connect', on_socket);
            //This errors are connection errors, when they happen call the correct event
            this.socket.on('error', function(){
                self.on_status({status: statuses.ERROR, errorCode: errors.TECH_ERROR});
            });
        };

        /**
         * Adds the required listeners to receive data from the server
         */
        hSessionSocketIO.prototype.addListeners = function(){
            var self = this;

            //Remove old listeners. Useful if reconnecting
            var events = ['hStatus', 'hMessage', 'result', 'result_error', 'attrs'];
            for(var i in events)
                this.socket.removeAllListeners(events[i]);

            //Listens for status changes
            this.socket.on('hStatus', self.on_status.bind(self));

            //Listen for items
            this.socket.on('hMessage', function(msg){
                self.rid++;
                self.callback({
                    type: 'message',
                    data: {channel: msg.channel, message: msg.message}});
            });

            //Listen for results for our requests
            this.socket.on('result', function(msg){
                self.rid++;
                self.callback({
                    type: 'result',
                    data: {type: msg.type, channel: msg.channel, msgid: msg.msgid}});
            });

            //Listen for errros to our requests
            this.socket.on('result_error', function(msg){
                self.rid++;
                self.callback({
                    type: 'error',
                    data: {type: msg.type, channel: msg.channel, msgid: msg.msgid}
                })
            });

            //Listen once for the attributes sent when connected
            this.socket.once('attrs', function(attrs){
                self.rid = attrs.rid;
                sessionStorage.setItem('publisher', attrs.publisher);
                sessionStorage.setItem('rid', attrs.rid);
                sessionStorage.setItem('sid', attrs.sid);
            });
        };

        /**
         * Asks the server to close the XMPP connection and the open socket
         */
        hSessionSocketIO.prototype.disconnect = function(){
            //If we are disconnected or another action in progress
            if(this.status == statuses.DISCONNECTED ||
                this.status == statuses.DISCONNECTING) return;

            //If we have errors that do not allow us to Retry,
            // disconnecting only closes the socket silently
            if(this.status == statuses.ERROR && this.errorCode == errors.AUTH_FAILED){
                this.socket.disconnect();
                return;
            }

            this.on_status({status: statuses.DISCONNECTING});
            clearTimeout(this.connect_timeout);
            //Remove our attrs
            sessionStorage.removeItem('publisher');
            sessionStorage.removeItem('sid');
            sessionStorage.removeItem('rid');
            if(this.socket)
                this.socket.disconnect();
            this.on_status({status: statuses.DISCONNECTED});
        };

        /**
         * Requests a subscription to an XMPP node to the server
         * @param channel - Name of the channel to subscribe
         */
        hSessionSocketIO.prototype.subscribe = function(channel){
            var data = {
                channel: channel,
                msgid: Math.floor(Math.random()*100001)
            };
            this.socket.emit('subscribe', data);
        };

        /**
         * Requests to unsubscribe from an XMPP node
         * @param channel - Name of the channel to unsubscribe
         */
        hSessionSocketIO.prototype.unsubscribe = function(channel){
            var data = {
                channel: channel,
                msgid: Math.floor(Math.random()*100001)
            };
            this.socket.emit('unsubscribe', data);
        };

        /**
         * Requests to publish a message to a channel
         * @param channel - Channel where the message will be published
         * @param message - element to publish to the channel
         */
        hSessionSocketIO.prototype.publish = function(channel, message){
            var data = {
                channel: channel,
                message: message,
                msgid: Math.floor(Math.random()*100001)
            };
            this.socket.emit('publish', data);
        };

        /**
         * Requests a list of messages from a channel to the server, messages
         * will be received as normal events.
         * @param channel
         */
        hSessionSocketIO.prototype.getMessages = function(channel){
            var data = {
                channel: channel,
                msgid: Math.floor(Math.random()*100001)
            };
            this.socket.emit('get_messages', data);
        };

        /**
         * Activates callback when there is a change in the server status
         * @param status - {status: statuses.*, code: <int>}
         */
        hSessionSocketIO.prototype.on_status = function(msg){
            if(msg){
                this.status = msg.status;
                this.errorCode = msg.errorCode;
                this.callback({type: types.hStatus, data: msg});

                if(msg.status == statuses.CONNECTED || msg.status == statuses.REATTACHED){
                    var self = this;
                    //Save RID when changing pages/refreshing (only browser)
                    if(typeof window !== 'undefined')
                        window.onunload = function(){
                            sessionStorage.setItem('rid', self.rid);
                        };

                    clearTimeout(this.connect_timeout);
                    this.retryIntervals = this.params.retryIntervals; //Resets the reconnection counter
                }
                else if(msg.status == statuses.ERROR){
                    clearTimeout(this.connect_timeout);
                    sessionStorage.removeItem('publisher');
                    sessionStorage.removeItem('sid');
                    sessionStorage.removeItem('rid');

                    if(msg.errorCode == errors.AUTH_FAILED ||
                        msg.errorCode == errors.ALREADY_CONNECTED) return;
                    var timeout = this.retryIntervals.length == 1 ? this.retryIntervals[0] : this.retryIntervals.pop();
                    setTimeout(this.connect.bind(this),timeout*1000);
                }
            }
        };

//requireJS way to allow other files to import this variable
        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);