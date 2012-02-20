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

define(
    [],
    function(){

        var statuses = {error: 'Error', connecting: 'Connecting', connected: 'Connected',
            disconnecting: 'Disconnecting', disconnected: 'Disconnected'};

        /**
         * Construtctor to establish a connection to the socketIO server.
         * @param opts - Required options to connect. See main.js to see a list of required elems.
         * @param onMessage - Callback executed each time a published message is sent from the server
         * @param onStatus - Callback executed each time there is a change with the state of the connection.
         * It takes as parameter one element of statuses.
         */
        var hSessionSocketIO = function(opts, onMessage, onStatus){
            this.options = opts;
            this.callback = onMessage;
            this.statusCallback = onStatus;
            this.establishConnection();
            this.on_subscribe(); //Starts listening responses to subscriptions
            this.on_unsubscribe(); //Starts listening responses to unsubscriptions
        };

        /**
         * Instantiates a socket to talk to the server
         */
        hSessionSocketIO.prototype.establishConnection = function(){
            this.statusCallback(statuses.disconnected);
            var config = {
                server: this.options.gateway.socketio.host.value || 'http://localhost',
                port: this.options.gateway.socketio.port.value || 8080,
                namespace: this.options.gateway.socketio.namespace.value || '/'
            };
            this.socket = io.connect(config.server + ':' + config.port+ config.namespace);
            this.socket.on('status', this.statusCallback);//Listens for status changes
        };

        /**
         * Normalizes connection options so that they can be used.
         * They use as a base the given options
         */
        hSessionSocketIO.prototype.createParameters = function(){
            var parameters = {
                jid: this.options.username.value,
                password: this.options.password.value,
                host: this.options.domain.value,
                port: 5222, //Default value
                domain: this.options.domain.value
            };

            //If a route is specified, the host and the port are different than default
            if(this.options.route.value.length > 0){
                var indSeparator = this.options.route.value.lastIndexOf(":");
                parameters.host = this.options.route.value.slice(0, indSeparator);
                if(this.options.route.value.length > indSeparator+1)
                    parameters.port = this.options.route.value.slice(indSeparator+1);
            }

            return parameters;
        };

        /**
         * Asks the server to connect to XMPP, sends the client's presence
         * and starts listening for messages
         */
        hSessionSocketIO.prototype.connect = function(){
            var data = {};
            data.parameters = this.createParameters();

            //Start the connection
            this.socket.emit('connect', data);
            //Listen for data
            this.socket.on('connect', this.callback);
        };

        /**
         * Asks the server to close the XMPP connection and the open socket
         */
        hSessionSocketIO.prototype.disconnect = function(){
            this.statusCallback(statuses.disconnecting);
            this.socket.disconnect();
            this.statusCallback(statuses.disconnected);
        };

        /**
         * Requests a subscription to an XMPP node to the server
         * The answer of the server is treated by on_subscribe
         * @param nodeName - Name of the node to subscribe
         */
        hSessionSocketIO.prototype.subscribe = function(nodeName){
            var data = {
                parameters: this.createParameters(),
                nodeName: nodeName
            };
            //Send data to the server in the correct channel
            this.socket.emit('subscribe', data);
        };

        /**
         * Requests to unsubscribe from an XMPP node
         * The answer of the server is treated by on_unsubscribe
         * @param nodeName - Name of the node to unsubscribe
         * @param subID - Subscription ID of the node to unsubscribe (needed *only* if multiple subscriptions)
         */
        hSessionSocketIO.prototype.unsubscribe = function(nodeName, subID){
            var data = {
                parameters: this.createParameters(),
                nodeName: nodeName,
                subID: subID
            };
            //Send data to the server in the correct channel
            this.socket.emit('unsubscribe', data);
        };

        /**
         * Listens for subscriptions and logs the result
         */
        hSessionSocketIO.prototype.on_subscribe = function(){
            this.socket.on('subscribe', function(res){
                if(res.status == 'success')
                    console.log('Subscription to node ' + res.node + ' succeeded');
            });
        };

        /**
         * Listens for unsunscribe responses and logs the result
         */
        hSessionSocketIO.prototype.on_unsubscribe = function(){
            this.socket.on('unsubscribe', function(res){
                if(res.status == 'success')
                    console.log('Unsubscription to node ' + res.node + ' succeeded');
            });
        };

        //This return is a requireJS way which allows other files to import this specific variable
        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);