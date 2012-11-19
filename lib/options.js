/*
 * Copyright (c) Novedia Group 2012.
 *
 *    This file is part of Hubiquitus
 *
 *    Permission is hereby granted, free of charge, to any person obtaining a copy
 *    of this software and associated documentation files (the "Software"), to deal
 *    in the Software without restriction, including without limitation the rights
 *    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 *    of the Software, and to permit persons to whom the Software is furnished to do so,
 *    subject to the following conditions:
 *
 *    The above copyright notice and this permission notice shall be included in all copies
 *    or substantial portions of the Software.
 *
 *    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 *    INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 *    PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 *    FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 *    ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *    You should have received a copy of the MIT License along with Hubiquitus.
 *    If not, see <http://opensource.org/licenses/mit-license.php>.
 */

//Make it compatible with node and web browser
if (typeof define !== 'function') { var define = require('amdefine')(module);}

define(
    [],
    function(){
        function hub_options(opts){
            return {
                //Intervals to try to reconnect to the server after a failure.
                //The values are in seconds and will be used from right to left.
                //The last one will be considered a constant interval. Meaning that once
                //used, it will be used again.
                retryIntervals : opts.retryIntervals || [600, 300, 60, 30, 10, 2],

                //How long should we wait when  trying to establish a connection.
                //If *timeout* is exceeded, a connection error will be given
                timeout : opts.timeout || 15000,

                //Transport to connect to the hNode
                transport : opts.transport,

                //Endpoint of the hNode. A random will be chosen from the array
                endpoints : opts.endpoints || ['http://localhost:5280/http-bind'],

                //If this option is set, several connections are allowed and reattach is
                //not possible anymore
                stress : opts.stress || false,

                msgTimeout : opts.msgTimeout || 30000,

                authCb : opts.authCb || function(user, cb){ cb(user, undefined) }
            };
        }

        //requireJS way to allow other files to import this variable
        return{
            hub_options: hub_options
        }
    }
);