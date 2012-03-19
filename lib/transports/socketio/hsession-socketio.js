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
    [],
    function(){
        var statuses = {
            Connecting: 'connecting',
            Connected: 'connected',
            Attaching: 'attaching',
            Attached: 'attached',
            Disconnecting: 'disconnecting',
            Disconnected: 'disconnected',
            Error: 'error'
        };
        var errors = {
            0: 'NO_ERROR',
            1: 'ALREADY_SUBSCRIBED',
            2: 'GET_SUBS_FAILED',
            3: 'FAILED_ATTACH',
            4: 'CONNECTION_FAILED',
            5: 'CONNECTION_TIMEOUT',

            //Convenience Vars in case we create the message errors:
            CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT'
        };

        //If a connection fails. This sets the timeouts for retrying. Used from right to left, in seconds.
        var retryTimeouts = [600, 300, 60, 30, 10, 2];
        var wait = 15 * 1000; //Time to wait for connection


        /**
         * Constructor to establish a connection to the socketIO server.
         * @param opts - Required options to connect. See main.js to see a list of required elems.
         * @param onMessage - Callback executed each time the server sends information.
         */
        var hSessionSocketIO = function(opts, onMessage){
            this.options = opts;
            this.callback = onMessage;
            this.retryTimeouts = retryTimeouts;
            this.establishConnection();
        };

        /**
         * Instantiates a socket to talk to the server
         */
        hSessionSocketIO.prototype.establishConnection = function(){
            this.socket = io.connect(this.options.gateway.socketio.endpoint +
                this.options.gateway.socketio.namespace);

            var self = this;
            //Listens for status changes
            this.socket.on('link', self.on_status.bind(self));

            //Wait before returning error in connection (cleared when connected)
            this.connect_timeout = setTimeout(function(){
                self.on_status.call(self,{status: statuses.error, message: errors.CONNECTION_TIMEOUT})
            }, wait);
        };

        hSessionSocketIO.prototype.attach = function(){
            this.socket =  io.connect(this.options.gateway.socketio.endpoint +
                this.options.gateway.socketio.namespace, {'force new connection': true});

            var self = this;
            //Add Listeners
            this.socket.on('link', self.on_status.bind(self));
            this.addListeners();

            this.socket.emit('attach', {
                userid: sessionStorage.getItem('userid'),
                rid: sessionStorage.getItem('rid'),
                sid: sessionStorage.getItem('sid')});

            //Wait before returning error in connection (cleared when connected)
            this.connect_timeout = setTimeout(function(){
                self.on_status.call(self,{status: statuses.error, message: errors.TIMEOUT})
            }, wait);
        };

        /**
         * Asks the gateway to connect to XMPP, sends the client's presence
         * and starts listening for messages
         */
        hSessionSocketIO.prototype.connect = function(){
            //If we have information stored, try to attach
            if(typeof sessionStorage.getItem('userid') === 'string'){
                this.attach();
                return;
            }

            var data = {
                jid: this.options.username,
                password: this.options.password,
                domain: this.options.domain
            };
            //If a route is specified, the host and the port are different than default
            if(this.options.route.length > 0){
                var splitted = this.options.route.split(':');
                data.host = splitted[0];
                data.port = splitted[1];
            }

            this.addListeners();
            //Start a new connection
            this.socket.emit('connect', data);
        };

        /**
         * Adds the required listeners to receive data from the server
         */
        hSessionSocketIO.prototype.addListeners = function(){
            var self = this;

            //Remove old listeners. Useful if reconnecting
            var events = ['items', 'result', 'error', 'attrs'];
            for(var i in events)
                this.socket.removeAllListeners(events[i]);

            //Listen for items
            this.socket.on('items', function(msg){
                sessionStorage.setItem('rid', parseInt(sessionStorage.getItem('rid'))+1);
                self.callback({
                    context: 'items',
                    data: {node: msg.node, entries: msg.entries}});
            });

            //Listen for results for our requests
            this.socket.on('result', function(msg){
                sessionStorage.setItem('rid', parseInt(sessionStorage.getItem('rid'))+1);
                self.callback({
                    context: 'result',
                    data: {type: msg.type, node: msg.node, id: msg.id}});
            });

            //Listen for errros to our requests
            this.socket.on('error', function(msg){
                sessionStorage.setItem('rid', parseInt(sessionStorage.getItem('rid'))+1);
                self.callback({
                    context: 'error',
                    data: {type: msg.type, node: msg.node, id: msg.id}
                })
            });

            //Listen once for the attributes sent when connected
            this.socket.once('attrs', function(attrs){
                sessionStorage.setItem('userid', attrs.userid);
                sessionStorage.setItem('rid', attrs.rid);
                sessionStorage.setItem('sid', attrs.sid);
            });
        };

        /**
         * Asks the server to close the XMPP connection and the open socket
         */
        hSessionSocketIO.prototype.disconnect = function(){
            this.on_status({status: statuses.Disconnecting});
            this.socket.disconnect();
            this.on_status({status: statuses.Disconnected});
        };

        /**
         * Requests a subscription to an XMPP node to the server
         * @param node - Name of the node to subscribe
         */
        hSessionSocketIO.prototype.subscribe = function(node){
            var data = {
                node: node,
                id: Math.floor(Math.random()*100001)
            };
            this.socket.emit('subscribe', data);
        };

        /**
         * Requests to unsubscribe from an XMPP node
         * @param nodeName - Name of the node to unsubscribe
         */
        hSessionSocketIO.prototype.unsubscribe = function(node){
            var data = {
                node: node,
                id: Math.floor(Math.random()*100001)
            };
            this.socket.emit('unsubscribe', data);
        };

        /**
         * Requests to publish entries to an XMPP node
         * @param node - Node to publish the items
         * @param items - element to publish to the node
         */
        hSessionSocketIO.prototype.publish = function(node, item){
            var data = {
                node: node,
                entry: item,
                id: Math.floor(Math.random()*100001)
            };
            this.socket.emit('publish', data);
        };

        /**
         * Activates callback when there is a change in the server status
         * @param status - {status: statuses.*, code: <int>}
         */
        hSessionSocketIO.prototype.on_status = function(msg){
            if(msg){
                this.callback({context: 'link', data: msg});

                if(msg.status == statuses.Connected || msg.status == statuses.Attached){
                    clearTimeout(this.connect_timeout);
                    this.retryTimeouts = retryTimeouts; //Resets the reconnection counter
                }
                else if(msg.status == statuses.Error){
                    clearTimeout(this.connect_timeout);
                    sessionStorage.clear();

                    var timeout = this.retryTimeouts.length == 1 ? this.retryTimeouts[0] : this.retryTimeouts.pop();
                    setTimeout(this.connect.bind(this),timeout*1000);
                }
            }
        }

        //requireJS way to allow other files to import this variable
        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);