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
}

define(
    [],
    function(){

        var statuses = {error: 'Error', connecting: 'Connecting', connected: 'Connected',
            disconnecting: 'Disconnecting', disconnected: 'Disconnected'};

        var errors = {TIMEOUT: "TIMEOUT"};

        /**
         * Constructor to establish a connection to the socketIO server.
         * @param opts - Required options to connect. See main.js to see a list of required elems.
         * @param onMessage - Callback executed each time the server sends information.
         */
        var hSessionSocketIO = function(opts, onMessage){
            this.options = opts;
            this.callback = onMessage;
            this.establishConnection();
        };

        /**
         * Instantiates a socket to talk to the server
         */
        hSessionSocketIO.prototype.establishConnection = function(){
            var wait = 15 * 1000; //Time to wait for connection

            this.socket = io.connect(this.options.gateway.socketio.endpoint +
                this.options.gateway.socketio.namespace);

            this.socket.on('link', this.on_status.bind(this));//Listens for status changes

            function connectionFailed(){
                this.on_status({status: statuses.error, message: errors.TIMEOUT});
            }

            //Wait before returning error in connection (cleared when connected)
            this.connect_timeout = setTimeout(connectionFailed.bind(this), wait);
        };

        /**
         * Asks the gateway to connect to XMPP, sends the client's presence
         * and starts listening for messages
         */
        hSessionSocketIO.prototype.connect = function(){
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

            //Start the connection
            this.socket.emit('connect', data);

            var self = this;
            //Listen for items
            this.socket.on('items', function(msg){
                self.callback({
                    context: 'items',
                    data: {node: msg.node, entries: msg.entries}});
            });

            //Listen for results for our requests
            this.socket.on('result', function(msg){
                self.callback({
                    context: 'result',
                    data: {type: msg.type, node: msg.node, id: msg.id}});
            });

            //Listen for errros to our requests
            this.socket.on('error', function(msg){
                self.callback({
                    context: 'error',
                    data: {type: msg.type, node: msg.node, id: msg.id}
                })
            });
        };

        /**
         * Asks the server to close the XMPP connection and the open socket
         */
        hSessionSocketIO.prototype.disconnect = function(){
            this.on_status({status: statuses.disconnecting});
            this.socket.disconnect();
            this.on_status({status: statuses.disconnected});
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

                if(msg.status == statuses.connected)
                    clearTimeout(this.connect_timeout);
                else if(msg.status == statuses.error)
                    this.disconnect();
            }
        }

        //requireJS way to allow other files to import this variable
        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);