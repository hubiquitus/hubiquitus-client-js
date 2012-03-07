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

        /**
         * Construtctor to establish a connection to the socketIO server.
         * @param opts - Required options to connect. See main.js to see a list of required elems.
         * @param onMessage - Callback executed each time a published message is sent from the server
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

            this.socket.on('status', this.on_status.bind(this));//Listens for status changes

            function connectionFailed(){
                this.on_status(statuses.error);
            }

            //Wait before returning error in connection (cleared when connected)
            this.connect_timeout = setTimeout(connectionFailed.bind(this), wait);
        };

        /**
         * Asks the server to connect to XMPP, sends the client's presence
         * and starts listening for messages
         */
        hSessionSocketIO.prototype.connect = function(){
            function rcvMessage(msg){
                for(var i in msg){
                    this.callback({type: 'data', data: msg[i]});
                }
            };

            var parameters = {
                jid: this.options.username,
                password: this.options.password,
                host: this.options.domain,
                port: '5222', //Default value
                domain: this.options.domain
            };
            //If a route is specified, the host and the port are different than default
            if(this.options.route.length > 0){
                var indSeparator = this.options.route.lastIndexOf(":");
                parameters.host = this.options.route.slice(0, indSeparator);
                if(this.options.route.length > indSeparator+1)
                    parameters.port = this.options.route.slice(indSeparator+1);
            }

            //Start the connection
            this.socket.emit('connect', {parameters: parameters});
            //Listen for items
            this.socket.on('item', rcvMessage.bind(this));
        };

        /**
         * Asks the server to close the XMPP connection and the open socket
         */
        hSessionSocketIO.prototype.disconnect = function(){
            this.on_status(statuses.disconnecting);
            this.socket.disconnect();
            this.on_status(statuses.disconnected);
        };

        /**
         * Requests a subscription to an XMPP node to the server
         * The answer of the server is treated by on_subscribe
         * @param nodeName - Name of the node to subscribe
         */
        hSessionSocketIO.prototype.subscribe = function(nodeName){
            var data = {
                nodeName: nodeName
            };
            this.socket.emit('subscribe', data);

            //Listens for the response
            this.socket.once('subscribe', function(res){
                if(res.status == 'success')
                    console.log('Subscription to node ' + res.node + ' succeeded');
            });
        };

        /**
         * Requests to unsubscribe from an XMPP node
         * The answer of the server is treated by on_unsubscribe
         * @param nodeName - Name of the node to unsubscribe
         * @param subID - Subscription ID of the node to unsubscribe (needed *only* if multiple subscriptions)
         */
        hSessionSocketIO.prototype.unsubscribe = function(nodeName, subID){
            var data = {
                nodeName: nodeName,
                subID: subID
            };
            this.socket.emit('unsubscribe', data);

            //Listens for the response
            this.socket.once('unsubscribe', function(res){
                if(res.status == 'success')
                    console.log('Unsubscription to node ' + res.node + ' succeeded');
            });
        };

        /**
         * Requests to publish entries to an XMPP node
         * @param nodeName - Node to publish the items
         * @param items - Array of elements to publish in the node (Optional)
         */
        hSessionSocketIO.prototype.publish = function(nodeName, items){
            var data = {
                nodeName: nodeName,
                items: items
            };
            this.socket.emit('publish', data);

            //Listens for the response
            this.socket.once('publish', function(res){
                if(res.status == 'success')
                    console.log('Publication to node ' + res.node + ' succeeded');
            });
        };

        /**
         * Activates callback when there is a change in the server status
         * @param status - One of the possible status defined by 'statuses'
         */
        hSessionSocketIO.prototype.on_status = function(status){
            if(status){
                this.callback({type: 'status', data: status});
                if(status == statuses.error)
                    this.disconnect();
                else if(status == statuses.connected)
                    clearTimeout(this.connect_timeout);
            }
        }

        //requireJS way to allow other files to import this variable
        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);