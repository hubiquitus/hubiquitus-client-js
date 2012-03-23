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
    var io = require('socket.io-client');
    var sessionStorage = require('../../sessionStorage.js');
}

define(
    ['../../codes'],
    function(codes){
        var statuses = codes.statuses;
        var errors = codes.errors;

        /**
         * Constructor to establish a connection to the socketIO server.
         * @param opts - Required options to connect. See main.js to see a list of required elems.
         * @param onMessage - Callback executed each time the server sends information.
         */
        var hSessionSocketIO = function(opts, onMessage){
            this.options = opts;
            this.callback = onMessage;
            this.retryIntervals = opts.retryIntervals;
            this.rid = 0;

            //If a route is specified, the host and the port are different than default
            if(opts.route.length > 0){
                var splitted = opts.route.split(':');
                this.options.host = splitted[0];
                this.options.port = splitted[1];
            }
        };

        /**
         * Connects to the gateway by using a new connection or by attaching
         * to an existing one and starts listening for events.
         * This sets a timer for the connection. If the timeout expires we send a CONNECTION_TIMEOUT
         * @options - Options to establish the socket
         */
        hSessionSocketIO.prototype.connect = function(options){
            var self = this;
            var on_socket = function(){
                self.addListeners();

                //If we have information stored, try to attach
                if(typeof sessionStorage.getItem('userid') === 'string'){
                    self.socket.emit('attach', {
                        userid: sessionStorage.getItem('userid'),
                        rid: sessionStorage.getItem('arid'),
                        sid: sessionStorage.getItem('sid')});
                }
                else{
                    //Start a new connection
                    self.socket.emit('hConnect', {
                        userid: self.options.username,
                        password: self.options.password,
                        domain: self.options.domain,
                        host: self.options.host,
                        port: self.options.port
                    });
                }
            };

            //Wait before returning error in connection
            self.connect_timeout = setTimeout(function(){
                self.on_status.call(self,{status: statuses.Error, code: errors.CONNECTION_TIMEOUT})
            }, self.options.timeout * 1000);

            //When reconnecting, the socket exists, we just need to attach or connect to XMPP
            if( this.socket && !options){
                on_socket();
                return;
            }

            this.socket = io.connect(this.options.gateway.socketio.endpoint +
                this.options.gateway.socketio.namespace, options);

            this.socket.on('connect', on_socket);
            //This errors are connection errors, when they happen call the correct event
            this.socket.on('error', function(){
                self.on_status({status: statuses.Error, code: errors.CONNECTION_TIMEOUT});
            });
        };

        /**
         * Adds the required listeners to receive data from the server
         */
        hSessionSocketIO.prototype.addListeners = function(){
            var self = this;

            //Remove old listeners. Useful if reconnecting
            var events = ['link', 'hMessage', 'result', 'result_error', 'attrs'];
            for(var i in events)
                this.socket.removeAllListeners(events[i]);

            //Listens for status changes
            this.socket.on('link', self.on_status.bind(self));

            //Listen for items
            this.socket.on('hMessage', function(msg){
                self.rid++;
                self.callback({
                    context: 'message',
                    data: {channel: msg.channel, message: msg.message}});
            });

            //Listen for results for our requests
            this.socket.on('result', function(msg){
                self.rid++;
                self.callback({
                    context: 'result',
                    data: {type: msg.type, channel: msg.channel, msgid: msg.msgid}});
            });

            //Listen for errros to our requests
            this.socket.on('result_error', function(msg){
                self.rid++;
                self.callback({
                    context: 'error',
                    data: {type: msg.type, channel: msg.channel, msgid: msg.msgid}
                })
            });

            //Listen once for the attributes sent when connected
            this.socket.once('attrs', function(attrs){
                self.rid = attrs.rid;
                sessionStorage.setItem('userid', attrs.userid);
                sessionStorage.setItem('rid', attrs.rid);
                sessionStorage.setItem('sid', attrs.sid);
            });
        };

        /**
         * Asks the server to close the XMPP connection and the open socket
         */
        hSessionSocketIO.prototype.disconnect = function(){
            this.socket.emit('hDisconnect');
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
                this.callback({context: 'link', data: msg});

                if(msg.status == statuses.Connected || msg.status == statuses.Attached){
                    var self = this;
                    //Set a timer to save RID every X seconds
                    self.ridSaver = setInterval(function(){
                        sessionStorage.setItem('rid', self.rid);
                    },self.options.ridInterval*1000);

                    clearTimeout(this.connect_timeout);
                    this.retryIntervals = this.options.retryIntervals; //Resets the reconnection counter
                }
                else if(msg.status == statuses.Error){
                    var opts = undefined;
                    if(msg.code == errors.AUTH_FAILED) return;
                    if(msg.code != errors.ATTACH_FAILED) opts = {'force new connection': true};
                    clearTimeout(this.connect_timeout);
                    clearInterval(this.ridSaver);
                    sessionStorage.removeItem('userid');
                    sessionStorage.removeItem('sid');
                    sessionStorage.removeItem('rid');

                    var timeout = this.retryIntervals.length == 1 ? this.retryIntervals[0] : this.retryIntervals.pop();
                    setTimeout(this.connect.bind(this, opts),timeout*1000);
                }
            }
        };

        //requireJS way to allow other files to import this variable
        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);