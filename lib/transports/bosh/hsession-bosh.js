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
        var types = codes.types;

        // Constructor
        var hSessionBosh = function(opts) {
            this.params = opts;
            this.callback = opts.hCallback;
            this.pubsub =  "pubsub." + this.params.publisher.split('@')[1];
            this.retryIntervals = this.params.retryIntervals;
            this.status = statuses.DISCONNECTED;
            this.errorCode = undefined;
            this.userDisconnect = false; //True when the user wants to disconnect

            //Create a Strophe connection
            this.conn = new Strophe.Connection(this.params.endpoint);
        };

        hSessionBosh.prototype = {

            /**
             * Tries to recover and reattach and old connection or connect to a new one.
             * @param force (boolean, optional). If defined and true. A reattach won't be tried and
             * a new connection will be started.
             */
            connect: function(force) {
                var re = new RegExp(this.params.publisher,"i");
                if( !force &&
                    typeof sessionStorage.getItem('publisher') === 'string'){
                    if(sessionStorage.getItem('publisher').search(re) != -1){
                        this.onStatus(true, {status: statuses.REATTACHING}); // Tell the user we are reattaching.
                        this.conn.attach(
                            sessionStorage.getItem('publisher'),
                            sessionStorage.getItem('sid'),
                            sessionStorage.getItem('rid'),
                            this.onStatus.bind(this, false),
                            null, null, null)
                    }else{
                        //We have an open connection but JIDs do not match, send an error.
                        this.onStatus(true, {status: statuses.ERROR, errorCode: errors.ALREADY_CONNECTED});
                    }
                }else{
                    //We don't have enough information to restablish the connection. Establish a new one
                    this.conn.connect(
                        this.params.publisher,
                        this.params.password,
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
                            errorCode = errors.TECH_ERROR;
                            statusCode = statuses.ERROR;
                            errorMsg = msg;
                            _onError();
                            break;
                        case Strophe.Status.CONNECTING:
                            statusCode = statuses.CONNECTING;
                            break;
                        case Strophe.Status.DISCONNECTING:
                            //If the disconnection was not by the user, treat it as an error.
                            if(this.userDisconnect)
                                statusCode = statuses.DISCONNECTING;
                            else{
                                statusCode = statuses.ERROR;
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
                            statusCode = statuses.ERROR;
                            errorCode = errors.AUTH_FAILED;
                            break;
                    }
                    status = {status: statusCode, errorCode: errorCode, errorMsg: errorMsg};
                }
                if(status.status){
                    this.status = status.status;
                    this.errorCode = status.errorCode;
                    this.sendCallback(types.hStatus, status);
                }
            },

            //Handle to retrieve items
            handleMessage: function(stanza) {
                var parsedItems = [];
                var _data = stanza.getElementsByTagName('items')[0];
                var _channel = _data.getAttribute('node');

                var items = _data.getElementsByTagName('item');
                for(var i = 0; i < items.length; i++)
                    parsedItems.push(items[i].childNodes[0].childNodes[0].textContent);

                //Calling client callback with the extracted message
                for(var i = 0; i < parsedItems.length; i++)
                    this.callback({type: 'message', data :
                    {channel: _channel, message: parsedItems[i]}})
                return true;
            },

            //Handles an hResult from the server
            handleHResult: function(stanza){
                var body = stanza.getElementsByTagName('body');
                body = body ? body[0] : undefined;

                if(body && body.getAttribute('type') == 'hresult'){
                    try{
                        var hResult = JSON.parse(body.textContent);
                        this.callback({type: 'hResult', data: hResult});
                    }
                    catch(err){
                        console.log('Error parsing hResult');
                    }
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
                //In case there is an error, disconnected or a disconnection
                // Do not tell strophe to disconnect again
                if( (this.status == statuses.ERROR && this.errorCode == errors.AUTH_FAILED) ||
                    this.status == statuses.DISCONNECTING ||
                    this.status == statuses.DISCONNECTED) return;
                //Set user intention of disconnecting
                this.userDisconnect = true;
                this.conn.flush();
                this.conn.disconnect();
            },

            subscribe: function(channel){
                /*
                 Done in two phases:
                 1. Ask for subscriptions and check if there are others to the same node
                 2. If there aren't, request a new one
                 */
                function _success(stanza){
                    this.callback({type: 'result', data:
                    {type: 'subscribe', channel: channel, msgid: msgId}});
                }

                function _failure(stanza, errorCode){
                    this.callback({type: 'error', data:
                    {type: 'subscribe', code: errorCode, channel: channel, msgid: msgId}});
                }

                function _callbackSubscriptions(stanza){
                    var subs = stanza.getElementsByTagName('subscriptions')[0].childNodes;
                    var i = 0;
                    while(i < subs.length && subs[i].getAttribute('node') != channel)
                        i++;

                    if(!subs[i] || subs[i].getAttribute('node') != channel){
                        //Not Subscribed
                        this.conn.pubsub.subscribe(
                            channel,
                            undefined,
                            undefined,
                            _success.bind(this),
                            _failure.bind(this));
                    } else{
                        //Already subscribed
                        _failure.call(this,stanza, errors.ALREADY_SUBSCRIBED);
                    }
                }

                var msgId = this.conn.pubsub.getSubscriptions(_callbackSubscriptions.bind(this));
                return msgId;
            },

            unsubscribe : function(channel){
                function _success(stanza){
                    this.callback({type: 'result', data:
                    {type: 'unsubscribe', channel: channel, msgid: stanza.getAttribute('id')}});
                }

                function _failure(stanza){
                    this.callback({type: 'error', data:
                    {type: 'unsubscribe', channel: channel, msgid: stanza.getAttribute('id')}});
                }

                return this.conn.pubsub.unsubscribe(
                    channel,
                    undefined,
                    undefined,
                    _success.bind(this),
                    _failure.bind(this));
            },

            publish : function(channel,item){
                function _callback(stanza){
                    if(stanza.getAttribute('type') == 'error')
                        this.callback({type: 'error', data:
                        {type: 'publish', channel: channel, msgid: stanza.getAttribute('id')}});
                    else
                        this.callback({type: 'result', data:
                        {type: 'publish', channel: channel, msgid: stanza.getAttribute('id')}});
                }

                return this.conn.pubsub.publish(
                    channel,
                    [{  data: $build("entry", {}).t(item).tree(),
                        attrs: {}
                    }],
                    _callback.bind(this));
            },

            getMessages : function(channel){
                function _failure(stanza){
                    this.callback({type: 'error', data:
                    {type: 'get_messages', channel: channel, msgid: stanza.getAttribute('id')}});
                }
                return this.conn.pubsub.items(channel,
                    this.handleMessage.bind(this), _failure.bind(this));
            },

            sendhCommand : function(hCommand){
                var msg = $msg({to: hCommand.entity})
                    .c('body', {type: 'hcommand'}, JSON.stringify(hCommand));
                this.conn.send(msg);
            },

            sendCallback : function(type, data){
                this.callback({
                    type: type,
                    data: data
                })
            }
        };

        //requireJS way to import
        return{
            hSessionBosh : hSessionBosh
        }
    }
);
