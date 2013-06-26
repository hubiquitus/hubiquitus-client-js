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

define(['../../codes','./socket.io'], function(codes, socket) {

        var statuses = codes.statuses;
        var errors = codes.errors;

        //Loading exclusive modules for Node
        if(typeof module !== 'undefined' && module.exports){
            io = require('socket.io-client');
        }

        if(typeof window !== 'undefined' && typeof window.io !== 'undefined') {
            io = window.io;
        }
        io = io || socket;

        /**
         * Constructor
         * @param login {string} user login
         * @param password {string} user password
         * @param context {object} login extra headers
         * @param cb {function} called to notify hAPI of a new event
         * @option cb type {string} event name
         * @option cb data {object} event object
         * @param opts {function} Connection options
         */
        var hSessionSocketIO = function(login, password, context, cb, opts){
            this.opts = opts;
            this.login = login;
            this.password = password;
            this.context = context;
            this.callback = cb;

            this.notifiedStatus = statuses.DISCONNECTED;

            this.opTime = undefined;
            this.socketConnTime = undefined;
            this.authSuccess = false;
            this.checkStatusScheduled = false;

            this.targetStatus = statuses.DISCONNECTED;
            this.currentStatus = statuses.DISCONNECTED;
        };

        /**
         * Ask the transport to connect to an hAPI gateways, authenticate and listen to events.
         * The transport handles auto-reconnect until the server becomes reachable.
         * If first authentification request fails, it stop connecting. If it's reconnecting it tries to reconnect.
         * If the connection timeout, it sends a timeout but auto connect keep working
         */
        hSessionSocketIO.prototype.connect = function() {
            if (this.targetStatus === statuses.CONNECTED) {
                error = errors.ALREADY_CONNECTED;
                if(this.currentStatus === statuses.CONNECTING)
                    error = errors.CONN_PROGRESS;

                this.notifyStatus(this.currentStatus, error);
                return;
            }

            this.targetStatus = statuses.CONNECTED;
            this.checkStatus();
        }

        /**
         * Notify the hAPI of a connection status update
         * @param status {number} Connection status code (see codes.statuses)
         * @param errorCode {number} Error code of the operation if needed.
         * @param errorMsg {string} a description of the error if errorCode is not NO_ERROR
         */
        hSessionSocketIO.prototype.notifyStatus = function(status, errorCode, errorMsg) {

            if(this.notifiedStatus === status)
                return;

            this.notifiedStatus = status;

            if (!errorCode)
                errorCode = statuses.NO_ERROR;

            msg = {status:this.currentStatus, errorCode:errorCode};
            if(errorMsg)
                msg.errorMsg = errorMsg;

            this.callback('hStatus', msg);
        }

        /**
         * Real connection status. It can differs from the one notified to the hAPI. For exemple auto-reconnect only notifies connecting.
         * @param status {number} connection status update
         */
        hSessionSocketIO.prototype.updateStatus = function(status) {
            this.currentStatus = status;
        }

        /**
         * Get socket.io connection status
         * @returns {number} see codes.statuses
         */
        hSessionSocketIO.prototype.socketioStatus = function() {
            if(!this.socket || !this.socket.socket)
                return statuses.DISCONNECTED

            if(this.socket.socket.connecting || this.socket.socket.reconnecting)
                return statuses.CONNECTING

            if(this.socket.socket.connected)
                return statuses.CONNECTED

            return statuses.DISCONNECTED;
        }

        /**
         * Asks the server transport to close the link
         */
        hSessionSocketIO.prototype.disconnect = function() {
            if(this.targetStatus === statuses.DISCONNECTED) {
                error = errors.NOT_CONNECTED;
                this.notifyStatus(this.currentStatus, error);
                return;
            }

            this.targetStatus = statuses.DISCONNECTED;
            this.checkStatus();
        }

        /**
         * Schedule a checkStatus task. We do not allow multiple checkStatus requests.
         */
        hSessionSocketIO.prototype.checkStatus = function() {
            if(this.checkStatusScheduled)
                return;

            this._checkStatus();
        }

        /**
         * Check connect status to go to the targeted connection status
         * Enforce a timeout on the connection to avoid waiting an undefined delay
         * @private
         */
        hSessionSocketIO.prototype._checkStatus = function() {
            this.checkStatusScheduled = true;
            if(this.targetStatus === this.currentStatus) {
                this.checkStatusScheduled = false;
                return;
            }
            try {
                var now = (new Date()).getTime();
                if(this.targetStatus === statuses.CONNECTED) {
                    if (now - this.socketConnTime > 4000){
                        this.socketConnTime = undefined;

                        if(this.socketioStatus() !== statuses.CONNECTED) {
                            this._disconnect();
                        }
                    }

                    if(this.socketioStatus() === statuses.DISCONNECTED && !this.socketConnTime) {
                        this.opTime = now;
                        this.updateStatus(statuses.CONNECTING);
                        this.notifyStatus(statuses.CONNECTING);
                        this._disconnect();
                        this._connect();
                     } else if(this.currentStatus !== statuses.CONNECTED) {
                        if(this.currentStatus === statuses.CONNECTING && (now - this.opTime > this.opts.timeout)) {
                            this._disconnect(errors.CONN_TIMEOUT);
                        } else if(this.currentStatus === statuses.DISCONNECTING) {
                            this._disconnect();
                        } else if(this.currentStatus !== statuses.CONNECTING) {
                            this.updateStatus(statuses.CONNECTING);
                            this.notifyStatus(statuses.CONNECTING);
                        }
                    }
                } else {
                    this._disconnect();
                }
            } catch (err) {
            }

            var self = this;
            setTimeout(function() {
                self._checkStatus();
            }, 1000);
        }

        /**
         * Send an authentification request to the server
         * @private
         */
        hSessionSocketIO.prototype._auth = function() {
            var self = this;
            this.opts.authCb(this.login, function(user, password){
                self.login = user;
                self.password = password || self.password;

                //Start a new connection
                self.socket.emit('hConnect', {
                    sent: (new Date()).getTime(),
                    login: self.login,
                    password: self.password,
                    context: self.context
                });
            });
        }

        /**
         * Close socket io connection
         * @param errorCode
         * @param errorMsg
         * @private
         */
        hSessionSocketIO.prototype._disconnect = function(errorCode, errorMsg) {
            if(this.currentStatus === statuses.DISCONNECTED) {
                this.checkStatus();
                return;
            } else if(this.currentStatus !== statuses.DISCONNECTING) {
                this.updateStatus(statuses.DISCONNECTING);
                if(this.targetStatus === statuses.DISCONNECTED)
                    this.notifyStatus(statuses.DISCONNECTING, errorCode, errorMsg);
            }

            this.authSuccess = false;
            this.removeListeners();

            this.socketConnTime = undefined;
            if(this.socket)
                this._closeSocket(this.socket);

            this.socket = undefined;
            this.updateStatus(statuses.DISCONNECTED);

            if(this.targetStatus === statuses.DISCONNECTED)
                this.notifyStatus(statuses.DISCONNECTED, errorCode, errorMsg);

            this.checkStatus();
        }

        hSessionSocketIO.prototype._closeSocket = function(socket) {
            var self = this;
            if(!socket)
                return

            if(!socket || !socket.socket || (!socket.socket.connecting && !socket.socket.reconnecting && !socket.socket.connected))
                return;

            socket.disconnect();
            setTimeout(function() {
                self._closeSocket(socket);
            }, 2000);
        }

        /**
         * Opens socket io connection and add listeners
         * We do not rely on socket.io auto reconnect
         * @private
         */
        hSessionSocketIO.prototype._connect = function() {
            if(this.socketioStatus() === statuses.CONNECTED || this.socketioStatus() === statuses.CONNECTING) {
                return;
            }

            var splittedEndpoint = this.opts.endpoint.match(new RegExp("^(.*)://([^/]*)/?(.*)$")).splice(1, 3);
            this.socketConnTime = (new Date()).getTime();
            if(splittedEndpoint[2] && splittedEndpoint[2].length > 0) {
                this.socket = io.connect(splittedEndpoint[0] + "://" + splittedEndpoint[1], {
                    'force new connection': true,
                    'connect timeout': 2000,
                    'transports': ['websocket', 'xhr-polling'],
                    'resource': splittedEndpoint[2]+'/socket.io'
                });
            } else {
                this.socket = io.connect(splittedEndpoint[0] + "://" + splittedEndpoint[1], {
                    'force new connection': true,
                    'connect timeout': 2000,
                    'transports': ['websocket', 'xhr-polling']
                });
            }

            //Avoid Socket.io auto reconnect
            this.socket.socket.options['max reconnection attempts'] = 0;
            this.addListeners();
        }

        /**
         * remove all listeners added on connect
         */
        hSessionSocketIO.prototype.removeListeners = function(){
            if(!this.socket)
                return;

            //Remove old listeners. Useful if reconnecting
            var events = ['hStatus', 'hMessage', 'attrs', 'disconnect', 'connect', 'error'];

            for(var i = 0; i < events.length; i++)
                this.socket.removeAllListeners(events[i]);
        }

        /**
         * Add listeners to be notified by socket.io of a new event or a connection status update
         */
        hSessionSocketIO.prototype.addListeners = function(){
            if(!this.socket)
                return;

            this.removeListeners();
            var self = this;

            this.socket.on('connect', function(){
                this.socketConnTime = undefined;
                self._auth();
            });

            //This errors are connection errors, when they happen call the correct event
            this.socket.on('error', function(reason){
                self.checkStatus();
            });

            this.socket.on('disconnect', function(reason){
                if(reason)
                    self._disconnect(errors.TECH_ERROR, reason);
                else
                    self._disconnect();
            });

            //Listens for status changes
            this.socket.on('hStatus', function(msg){
                self.onhStatus(msg);
                self.checkStatus();
            });

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
         * Sends an hMessage to the gaeteway
         */
        hSessionSocketIO.prototype.sendhMessage = function(hMessage){
            this.socket.emit('hMessage', hMessage);
        };

        /**
         * Called on the server connection status update. This is mainly used in authentification system
         */
        hSessionSocketIO.prototype.onhStatus = function(msg) {
            if(msg){
                if(msg.status === statuses.CONNECTED) {
                    this.authSuccess = true;
                    this.currentStatus = statuses.CONNECTED;
                    this.notifyStatus(statuses.CONNECTED);

                } else if(msg.errorCode === errors.AUTH_FAILED) {
                    if(!this.authSuccess)
                        this.targetStatus = statuses.DISCONNECTED;
                    this._disconnect(errors.AUTH_FAILED, msg.errorMsg);

                } else {
                    this._disconnect(errors.TECH_ERROR, msg.errorMsg);
                }
            }
        };

        return{
            hSessionSocketIO: hSessionSocketIO
        }
    }
);