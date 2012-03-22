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
if (typeof define !== 'function') { var define = require('amdefine')(module);}

define(
    [],
    function(){

        function hub_options(opts){
            var _opts = {
                //Domain of the Username (Only if different than username@domain.com)
                domain :   opts.domain,

                //Route to connect to the XMPP Server (only use if domain is different than
                //XMPP Server or port different than default (format: host:port)
                route : opts.route || '',

                //Intervals to try to reconnect to the server after a failure.
                //The values are in seconds and will be used from right to left.
                //The last one will be considered a constant interval. Meaning that once
                //used, it will be used again.
                retryIntervals : opts.retryIntervals || [600, 300, 60, 30, 10, 2],

                //How long should we wait trying to establish a connection. If *timeout*
                //is exceeded, a connection error will be given
                timeout : opts.timeout || 15,

                //Time in seconds to save the current RID (used to make a reattach)
                ridInterval : opts.ridInterval || 10,

                //Configuration relative to the transports. For each client, only the part
                //corresponding to the selected transport is needed.
                gateway : {
                    //Selected transport (socketio | bosh)
                    transport : opts['gateway.transport'] || 'bosh',
                    socketio : {
                        //Endpoint of the SocketIO server (format protocol://address/)
                        endpoint : opts['gateway.socketio.endpoint'] || 'http://localhost/',

                        //Array of ports where the SocketIO server is listening
                        ports : opts['gateway.socketio.ports'] || [8080],

                        //Namespace for the messages sent
                        namespace : opts['gateway.socketio.namespace'] || ''
                    },
                    bosh : {
                        //Endpoint of the Bosh server
                        endpoint : opts['gateway.bosh.endpoint'] || 'http://localhost/http-bind',

                        //Array of ports where the Bosh server is listening
                        ports : opts['gateway.bosh.ports'] || [5280]
                    }
                }
            };

            return _opts;
        };

        //requireJS way to allow other files to import this variable
        return{
            hub_options: hub_options
        }
    }
);