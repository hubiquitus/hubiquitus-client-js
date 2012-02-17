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

        var hSessionSocketIO = function(opts, onMessage){
            this.options = opts;
            this.callback = onMessage;
            this.establishConnection();
        };

        hSessionSocketIO.prototype.establishConnection = function(){
            var config = {
                server: this.options.gateway.socketio.host.value || 'http://localhost',
                port: this.options.gateway.socketio.port.value || 8080,
                namespace: this.options.gateway.socketio.namespace.value || '/'
            };
            this.socket = io.connect(config.server + ':' + config.port+ config.namespace);
        };
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
        hSessionSocketIO.prototype.connect = function(){
            var data = {};
            data.parameters = this.createParameters();

            //Start the connection
            this.socket.emit('connect', data);
            //Listen for data
            this.socket.on('connect', this.callback);
        };
        hSessionSocketIO.prototype.disconnect = function(){
            this.socket.disconnect();
        };
        hSessionSocketIO.prototype.subscribe = function(nodeName){
            var data = {};
            data.parameters = this.createParameters();
            data.nodeName = nodeName;
            //Send data to the server in the correct channel
            this.socket.emit('subscribe', data);
            //Listen for answer
            this.socket.on('subscribe', function(res){
                if(res == 'success')
                    console.log('Subscribed');
            });
        };

        //This return is a requireJS way which allows other files to import this specific variable
        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);