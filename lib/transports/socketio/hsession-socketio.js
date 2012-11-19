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
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
    ['../../codes','./socket.io'],
    function(codes, socket){
        var statuses = codes.statuses;
        var errors = codes.errors;

        //Loading exclusive modules for Node
        if(typeof module !== 'undefined' && module.exports){
            io = require('socket.io-client');
        }
        io = io || socket;

        /**
         * Constructor to establish a connection to the socketIO server.
         * @param opts - Required options to connect
         */
        var hSessionSocketIO = function(publisher, password, cb, opts){
            this.opts = opts;
            this.publisher = publisher;
            this.password = password;
            this.callback = cb;
            this.retryIntervals = opts.retryIntervals;
            this.status = statuses.DISCONNECTED;
            this.errorCode = errors.NO_ERROR;
        };

        /**
         * Connects to the gateway by using a new connection or by attaching
         * to an existing one and starts listening for events.
         * This sets a timer for the connection. If the timeout expires we send a CONNECTION_TIMEOUT
         * @options - Options to establish the socket
         */
        hSessionSocketIO.prototype.connect = function(publisher){
            var self = this;
            var on_socket;

            var re = new RegExp(this.publisher,"i");
            //If we have information stored, and not of the same user, send error.
            if(!this.opts.stress && typeof publisher === 'string' && publisher.search(re) == -1){
                this.on_status({status: statuses.CONNECTED, errorCode: errors.ALREADY_CONNECTED});
                return;
            }


            //Only send a Connecting if not reconnecting
            if(self.errorCode == errors.NO_ERROR)
                self.on_status({status: statuses.CONNECTING, errorCode: errors.NO_ERROR});
            on_socket = function(){
                self.addListeners();
                self.opts.authCb(self.publisher, function(user, password){
                    self.publisher = user;
                    self.password = password || self.password;
                });

                //Start a new connection
                self.socket.emit('hConnect', {
                    sent: new Date(),
                    publisher: self.publisher,
                    password: self.password });
            };


            //Wait before returning error in connection
            this.connect_timeout = setTimeout(function(){
                self.on_status.call(self,{status: statuses.CONNECTING, errorCode: errors.CONN_TIMEOUT})
            }, self.opts.timeout);

            //When reconnecting, the socket exists, we just need to attach or connect to XMPP
            //FIXME: this test in browser doesn't work
            if( !this.opts.stress && this.socket ){
                on_socket();
                return;
            }

            /* Proxy path */
            var splittedEndpoint = this.opts.endpoint.match(new RegExp("^(.*)://([^/]*)/?(.*)$")).splice(1, 3);
            if(splittedEndpoint[2] && splittedEndpoint[2].length > 0)
                this.socket = io.connect(splittedEndpoint[0] + "://" + splittedEndpoint[1], {
                    'force new connection': true,
                    'connect timeout': 2000,
                    'transports': ['websocket', 'xhr-polling'],
                    'resource': splittedEndpoint[2]+'/socket.io'
                });
            else
                this.socket = io.connect(splittedEndpoint[0] + "://" + splittedEndpoint[1], {
                    'force new connection': true,
                    'connect timeout': 2000,
                    'transports': ['websocket', 'xhr-polling']
                });

            //Define reconnection options
            this.socket.socket.options['reconnection delay'] = 2000;
            this.socket.socket.options['reconnection limit'] = 64000;
            this.socket.socket.options['max reconnection attempts'] = Infinity;

            this.socket.on('connect', on_socket);
            //This errors are connection errors, when they happen call the correct event
            this.socket.on('error', function(reason){
                if(reason.currentTarget.toString() == '[object WebSocket]')
                    return;
                self.on_status({status: statuses.DISCONNECTED, errorCode: errors.TECH_ERROR});
            });

            this.socket.on('disconnect', function(reason){
                if(reason === undefined)
                    self.on_status({status: statuses.DISCONNECTED, errorCode: errors.TECH_ERROR});
            });
        };

        /**
         * Adds the required listeners to receive data from the server
         */
        hSessionSocketIO.prototype.addListeners = function(){
            var self = this;

            //Remove old listeners. Useful if reconnecting
            var events = ['hStatus', 'hMessage', 'hResult', 'hCommand', 'attrs'];
            for(var i = 0; i < events.length; i++)
                this.socket.removeAllListeners(events[i]);

            //Listens for status changes
            this.socket.on('hStatus', function(msg){self.on_status.call(self,msg)});

            //Listen for items
            this.socket.on('hMessage', function(hMessage){
                self.callback('hMessage', hMessage);
            });

            //Listen once for the attributes sent when connected
            this.socket.once('attrs', function(attrs){
                self.callback('attrs', attrs);
            });
        };

        /**
         * Asks the server to close the XMPP connection and the open socket
         */
        hSessionSocketIO.prototype.disconnect = function(){
            try{
                //If we are disconnected or another action in progress
                if(this.status == statuses.DISCONNECTED || this.status == statuses.DISCONNECTING){
                    if(this.socket)
                        this.socket.disconnect();
                    return;
                }

                this.on_status({status: statuses.DISCONNECTING, errorCode: errors.NO_ERROR});
                clearTimeout(this.connect_timeout);
                if(this.socket)
                    this.socket.disconnect();
                this.on_status({status: statuses.DISCONNECTED, errorCode: errors.NO_ERROR});
            }
            catch(err){
                //Avoid socket-io issue when disconnect during connecting
            }
        };

        /**
         * Sends an hCommand to the Server (implicitly waiting for an hResult)
         * @param hMessage - an hCommand built using hCommandBuilder
         */
        hSessionSocketIO.prototype.sendhMessage = function(hMessage){
            this.socket.emit('hMessage', hMessage);
        };

        /**
         * Activates callback when there is a change in the server status
         * @param status - {status: statuses.*, code: <int>}
         */
        hSessionSocketIO.prototype.on_status = function(msg){
            if(msg){
                this.status = msg.status;
                this.errorCode = msg.errorCode;
                this.callback('hStatus', msg);

                if(msg.errorCode == errors.NO_ERROR &&
                    (msg.status == statuses.CONNECTED)){
                    var self = this;

                    clearTimeout(this.connect_timeout);
                    this.retryIntervals = this.opts.retryIntervals; //Resets the reconnection counter
                }
                else if(msg.errorCode != errors.NO_ERROR){
                    clearTimeout(this.connect_timeout);
                    if(msg.errorCode == errors.AUTH_FAILED ||
                        msg.errorCode == errors.ALREADY_CONNECTED) return;
                }
            }
        };

//requireJS way to allow other files to import this variable
        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);