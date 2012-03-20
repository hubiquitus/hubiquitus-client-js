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
    ['./lib/transports/bosh/hsession-bosh', './lib/transports/socketio/hsession-socketio', './lib/options'],
    function(hSessionBosh, hSessionSocketIO, createOptions){

        /**
         * Creates a new client that manages a connection and connects to the
         * XMPP Server.
         * @param username - username to login to the server
         * @param password - password to login with
         * @param callback - function that receives status/msg sent by the server.
         * @param options - Object with configuration settings. See lib/options.js
         */
        var HubiquitusClient = function(username, password, callback, options){
            options = options || {};
            this.options = createOptions.hub_options(options);
            this.options.username = username;
            this.options.password = password;
            this.onMessage = callback;
            this.connect();
        };

        HubiquitusClient.prototype = {
            connect : function(){
                var selTransport = this.options.gateway.transport;

                //Load Balancing
                this.options.gateway[selTransport].endpoint = loadBalancing(
                    this.options.gateway[selTransport].endpoint, this.options.gateway[selTransport].ports);

                //Choose Correct transport instance
                if(selTransport == 'bosh'){
                    this.transport = new hSessionBosh.hSessionBosh(this.options, this.onMessage);
                }else if(selTransport =='socketio'){
                    this.transport = new hSessionSocketIO.hSessionSocketIO(this.options, this.onMessage);
                }else{
                    console.log("Error, no transport");
                    return;
                }

                //Establish the connection
                this.transport.connect();
            },
            disconnect : function(){
                this.transport.disconnect();
            },
            subscribe : function(channel){
                this.transport.subscribe(channel);
            },
            unsubscribe : function(channel){
                this.transport.unsubscribe(channel);
            },
            publish : function(channel, hMessage){
                this.transport.publish(channel,hMessage);
            },
            getMessages: function(channel){
                this.transport.getMessages(channel);
            }
        };

        function loadBalancing(endpoint, ports){
            var port = ports[Math.floor(Math.random()*ports.length)]; //Randomize used port

            //Rewrite Endpoint using the selected port
            var parts = endpoint.split(/(\w+:\/\/[\w\.-]+)(.*)/);
            parts[2] += !parts[2].match(/\/$/) ? '/' : ''; //Normalize endpoint
            return parts[1] + ':' + port + parts[2];
        }

        //requireJS way to export
        return{
            connect : function(username, password, callback, options){
                return new HubiquitusClient(username, password, callback, options);
            }
        }
    }
);

