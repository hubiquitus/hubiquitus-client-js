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
            return {
                //Server host if different than domain
                serverHost: opts.serverHost || '',

                //Server port if different than default
                serverPort: opts.serverPort || 5222,

                //Name of the hServer (without domain)
                hServer: opts.hServer || 'hnode',

                //Intervals to try to reconnect to the server after a failure.
                //The values are in seconds and will be used from right to left.
                //The last one will be considered a constant interval. Meaning that once
                //used, it will be used again.
                retryIntervals : opts.retryIntervals || [600, 300, 60, 30, 10, 2],

                //How long should we wait when  trying to establish a connection.
                //If *timeout* is exceeded, a connection error will be given
                timeout : opts.timeout || 15,

                //Transport to connect to the hNode
                transport : opts.transport,

                //Endpoint of the hNode. A random will be chosen from the array
                endpoints : opts.endpoints || ['http://localhost:5280/http-bind'],

                //If this option is set, several connections are allowed and reattach is
                //not possible anymore
                stress : opts.stress || false,

                msgTimeout : opts.msgTimeout || 30000
            };
        }

        //requireJS way to allow other files to import this variable
        return{
            hub_options: hub_options
        }
    }
);