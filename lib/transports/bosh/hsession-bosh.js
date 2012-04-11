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
        var contexts = codes.contexts;

        // Constructor
        var hSessionBosh = function(opts) {
            this.params = opts;
            this.callback = opts.hCallback;
            this.pubsub =  "pubsub." + this.params.publisher.split('@')[1];
            this.retryIntervals = this.params.retryIntervals;
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
                //If we have information stored and not connecting to another user, try to attach
                var re = new RegExp(this.params.publisher,"i");
                if( !force &&
                    typeof sessionStorage.getItem('publisher') === 'string' &&
                    sessionStorage.getItem('publisher').search(re) != -1){
                    this.onStatus(true, statuses.Reattaching); // Tell the user we are reattaching.
                    this.conn.attach(
                        sessionStorage.getItem('publisher'),
                        sessionStorage.getItem('sid'),
                        sessionStorage.getItem('rid'),
                        this.onStatus.bind(this, false),
                        null, null, null)
                } else{
                    //We don't have enough information to restablish the connection. Establish a new one
                    this.conn.connect(
                        this.params.publisher,
                        this.params.password,
                        this.onStatus.bind(this, false),
                        null, null, null
                    );
                }
            },

            //Callback for the connection status.
            //When connected, send presence to the server and set the callback to retrieve stanzas
            //hCode indicates if the code is an hubiquitus code, otherwise is considered an strophe code.
            onStatus: function(hCode, status)
            {
                var errorCode;
                var statusCode;
                var self = this;

                function _onConnection(){
                    //Send Presence
                    self.conn.send($pres());

                    //Add Handlers
                    self.conn.addHandler(self.handleIQ.bind(self), null, 'iq', 'get',null, null, {matchBare: true});
                    self.conn.addHandler(self.handleMessage.bind(self), Strophe.NS.PUBSUB_EVENT,'message',
                        null, null, self.pubsub, {matchBare: true});

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

                if(hCode){
                    statusCode = status;
                }else{
                    switch(status){
                        case Strophe.Status.ATTACHED:
                            statusCode = statuses.Reattached;
                        case Strophe.Status.CONNECTED:
                            statusCode = statusCode || statuses.Connected;
                            _onConnection();
                            break;
                        case Strophe.Status.CONNFAIL:
                        case Strophe.Status.ERROR:
                            errorCode = errors.UNKNOWN;
                            statusCode = statuses.Error;
                            _onError();
                            break;
                        case Strophe.Status.CONNECTING:
                            statusCode = statuses.Connecting;
                            break;
                        case Strophe.Status.DISCONNECTING:
                            //If the disconnection was not by the user, treat it as an error.
                            if(this.userDisconnect)
                                statusCode = statuses.Disconnecting;
                            else{
                                statusCode = statuses.Error;
                                errorCode = errors.UNKNOWN;
                            }
                            break;
                        case Strophe.Status.DISCONNECTED:
                            statusCode = statuses.Disconnected;
                            //If the disconnection was not by the user, treat it as an error.
                            if(!this.userDisconnect)
                                _onError();
                            break;
                        case Strophe.Status.AUTHFAIL:
                            statusCode = statuses.Error;
                            errorCode = errors.AUTH_FAILED;
                            break;
                    }
                }
                if(statusCode)
                    this.sendCallback(contexts.hStatus, {status: statusCode, errorCode: errorCode})
            },

            //Handle to retrieve items
            handleMessage: function(stanza) {

                var parsedItems = [];
                var _data = stanza.getElementsByTagName('items')[0];
                var _channel = _data.getAttribute('node');

                var items = _data.getElementsByTagName('item');
                for(var i = 0; i < items.length; i++)
                    parsedItems.push(items[i].childNodes[0].childNodes[0].nodeValue);

                //Calling client callback with the extracted message
                for(var i in parsedItems)
                    this.callback({context: 'message', data :
                    {channel: _channel, message: parsedItems[i]}})
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
                    this.callback({context: 'result', data:
                    {type: 'subscribe', channel: channel, msgid: msgId}});
                }

                function _failure(stanza, errorCode){
                    this.callback({context: 'error', data:
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
                    this.callback({context: 'result', data:
                    {type: 'unsubscribe', channel: channel, msgid: stanza.getAttribute('id')}});
                }

                function _failure(stanza){
                    this.callback({context: 'error', data:
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
                        this.callback({context: 'error', data:
                        {type: 'publish', channel: channel, msgid: stanza.getAttribute('id')}});
                    else
                        this.callback({context: 'result', data:
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
                    this.callback({context: 'error', data:
                    {type: 'get_messages', channel: channel, msgid: stanza.getAttribute('id')}});
                }
                return this.conn.pubsub.items(channel,
                    this.handleMessage.bind(this), _failure.bind(this));
            },

            sendCallback : function(context, data){
                this.callback({
                    context: context,
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
