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
}

define(
    ['./strophe.pubsub', '../../codes', '../../sessionStorage'],
    function(Strophe, codes, sessionStorageAux){

        //Load correct modules if running on Node
        if(typeof module !== 'undefined' && module.exports){
            $iq     = Strophe.$iq;
            $msg    = Strophe.$msg;
            $pres   = Strophe.$pres;
            $build  = Strophe.$build;
        }

        //Taking care of session Storage. Sometimes the browser doesn't find it
        //And if it's node or we don't have support so we use 'our version'
        if(!sessionStorage){
            if(typeof window !== 'undefined' && window.sessionStorage)
                var sessionStorage = window.sessionStorage;
            else
                var sessionStorage = sessionStorageAux.sessionStorage;
        }

        var Strophe = Strophe.Strophe;
        var errors = codes.errors;
        var statuses = codes.statuses;

        // Constructor
        var hSessionBosh = function(publisher, password, cb, opts) {
            this.publisher = publisher;
            this.password = password;
            this.opts = opts;
            this.callback = cb;

            this.pubsub =  "pubsub." + publisher.split('@')[1];
            this.hnode = 'hnode.' + publisher.split('@')[1];

            this.retryIntervals = this.opts.retryIntervals;
            this.status = statuses.DISCONNECTED;
            this.errorCode = errors.NO_ERROR;

            this.userDisconnect = false; //True when the user wants to disconnect

            //Create a Strophe connection
            this.conn = new Strophe.Connection(opts.endpoint);
        };

        hSessionBosh.prototype = {

            /**
             * Tries to recover and reattach and old connection or connect to a new one.
             * @param force (boolean, optional). If defined and true. A reattach won't be tried and
             * a new connection will be started.
             */
            connect: function(force) {
                force = force || this.opts.stress;

                var re = new RegExp(this.publisher,"i");
                if( !force &&
                    typeof sessionStorage.getItem('publisher') === 'string'){
                    if(sessionStorage.getItem('publisher').search(re) != -1){
                        // Tell the user we are reattaching.
                        this.onStatus(true, {status: statuses.REATTACHING, errorCode: errors.NO_ERROR});
                        this.conn.attach(
                            sessionStorage.getItem('publisher'),
                            sessionStorage.getItem('sid'),
                            sessionStorage.getItem('rid'),
                            this.onStatus.bind(this, false),
                            null, null, null)
                    }else{
                        //We have an open connection but JIDs do not match, send an error.
                        this.onStatus(true, {status: statuses.CONNECTED, errorCode: errors.ALREADY_CONNECTED});
                    }
                }else{
                    //We don't have enough information to restablish the connection. Establish a new one
                    this.conn.connect(
                        this.publisher,
                        this.password,
                        this.onStatus.bind(this, false),
                        null, null, null
                    );
                }
            },

            /**
             * Callback for the connection status. Accepts Strophe or proper hStatus as values
             * @param isHStatus - if the status should be interpreted as an hStatus or an Strophe Status
             * @param status - The status to send to the client.
             * @param msg - Specific message sent --sometimes-- by strophe to indicate the error
             */
            onStatus: function(isHStatus, value, msg)
            {
                var errorCode;
                var statusCode;
                var errorMsg;
                var status = value;
                var self = this;

                function _onConnection(){
                    //Send Presence
                    self.conn.send($pres());

                    //Add Handlers
                    self.conn.addHandler(self.handleIQ.bind(self), null, 'iq', 'get',null, null, {matchBare: true});
                    self.conn.addHandler(self.handleMessage.bind(self), Strophe.NS.PUBSUB_EVENT,'message',
                        null, null, self.pubsub, {matchBare: true});
                    self.conn.addHandler(self.handleHResult.bind(self), null, 'message',
                        null, null, self.hnode, {matchBare: true});

                    //Save attrs when changing pages/refreshing (only browser)
                    if(typeof window !== 'undefined')
                        window.onunload = function(){
                            sessionStorage.setItem('publisher', self.conn.jid);
                            sessionStorage.setItem('sid', self.conn.sid);
                            sessionStorage.setItem('rid', self.conn.rid);
                        };

                    self.retryIntervals = self.params.retryIntervals; //Resets the reconnection counter
                }
                function _onError(){
                    sessionStorage.removeItem('publisher');
                    sessionStorage.removeItem('sid');
                    sessionStorage.removeItem('rid');

                    var timeout = self.retryIntervals.length == 1 ? self.retryIntervals[0] : self.retryIntervals.pop();
                    self.connect_retry = setTimeout(self.connect.bind(self, true),timeout*1000);
                }

                if(!isHStatus){
                    switch(value){
                        case Strophe.Status.ATTACHED:
                            statusCode = statuses.REATTACHED;
                        case Strophe.Status.CONNECTED:
                            statusCode = statusCode || statuses.CONNECTED;
                            _onConnection();
                            break;
                        case Strophe.Status.CONNFAIL:
                        case Strophe.Status.ERROR:
                            errorCode = errors.CONN_TIMEOUT;
                            statusCode = statuses.CONNECTING;
                            errorMsg = msg;
                            _onError();
                            break;
                        case Strophe.Status.CONNECTING:
                            //This removes  the second connecting after a connection error
                            statusCode = this.errorCode != errors.NO_ERROR ? undefined : statuses.CONNECTING;
                            break;
                        case Strophe.Status.DISCONNECTING:
                            //Clear the reconnection timeout
                            clearTimeout(this.connect_retry);
                            //If the disconnection was not by the user, treat it as an error.
                            if(this.userDisconnect)
                                statusCode = statuses.DISCONNECTING;
                            else{
                                statusCode = statuses.DISCONNECTED;
                                errorCode = errors.TECH_ERROR;
                            }
                            break;
                        case Strophe.Status.DISCONNECTED:
                            statusCode = statuses.DISCONNECTED;
                            //If the disconnection was not by the user, treat it as an error.
                            if(!this.userDisconnect)
                                _onError();
                            break;
                        case Strophe.Status.AUTHFAIL:
                            statusCode = statuses.DISCONNECTED;
                            errorCode = errors.AUTH_FAILED;
                            break;
                    }
                    status = {status: statusCode, errorCode: errorCode || errors.NO_ERROR, errorMsg: errorMsg};
                }
                if(status.status){
                    this.status = status.status;
                    this.errorCode = status.errorCode || errors.NO_ERROR;
                    this.callback('hStatus', status);
                }
            },

            //Handle to retrieve items (needs to return true to persist callback in strophe)
            handleMessage: function(stanza) {
                var _data = stanza.getElementsByTagName('items')[0];

                if(!_data) return true;

                var item = _data.getElementsByTagName('item')[0];
                if(item){
                    var hMessage = item.childNodes[0].childNodes[0].textContent;
                    try{
                        hMessage = JSON.parse(hMessage);
                    }catch(err){return true}

                    if(hMessage)
                        this.callback('hMessage', hMessage);
                }
                return true;
            },

            //Handles an hResult from the server
            handleHResult: function(stanza){
                var body = stanza.getElementsByTagName('hbody');
                body = body ? body[0] : undefined;

                if(body && body.getAttribute('type') == 'hresult'){
                    var hResult = null;
                    try{
                        hResult = JSON.parse(body.textContent);
                    }
                    catch(err){
                        console.log('Error parsing hResult');
                    }
                    if(hResult)
                        this.callback('hResult', hResult);
                }
                return true;
            },

            //In case we receive an iq-get request, send an error cause we don't allow them
            handleIQ : function(stanza){
                var msg = $iq({
                    to: stanza.attributes.from.nodeValue,
                    type: 'error',
                    id: stanza.attributes.id.nodeValue
                })
                    .c(stanza.firstChild.nodeName, {xmlns: stanza.firstChild.attributes.xmlns.nodeValue}).up()
                    .c('error', { type: 'cancel'})
                    .c('service-unavailable', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'});

                console.log("Received an IQ from the server. Responding.");
                this.conn.send(msg);
                return true; //If it doesn't return true, Strophe will remove it from Handler's list
            },

            disconnect: function() {
                clearTimeout(this.connect_retry);
                //Remove our attrs
                sessionStorage.removeItem('publisher');
                sessionStorage.removeItem('sid');
                sessionStorage.removeItem('rid');
                //Set user intention of disconnecting
                this.userDisconnect = true;
                //In case there is an error, disconnected or a disconnection
                // Do not tell strophe to disconnect again
                if( this.status == statuses.DISCONNECTED || this.status == statuses.DISCONNECTING ) return;
                this.conn.flush();
                this.conn.disconnect();
            },

            sendhCommand : function(hCommand){
                var msg = $msg({to: hCommand.entity})
                    .c('hbody', {type: 'hcommand'}, JSON.stringify(hCommand));
                this.conn.send(msg);
            }

        };

        //requireJS way to import
        return{
            hSessionBosh : hSessionBosh
        }
    }
);
