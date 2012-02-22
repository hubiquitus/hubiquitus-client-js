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
 
//This function allows to build alias thanks to paths
require.config({
  paths: {
    Strophe: 'lib/transports/bosh/strophe',
    StrophePubsub: 'lib/transports/bosh/strophe.pubsub'
  }

});

define(
	['Strophe', 'StrophePubsub'],
	function(Strophe, spubsub){

		var Strophe = Strophe.Strophe;
			
		// Constructor
		var hSessionBosh = function(opts, onMessage, onStatus, onCookie) {
			this.options = opts;
			this.callback = onMessage;
			this.conn = null;
			this.suscribed = false;
			this.currentStatus = onStatus;
			this.callbackCookie = onCookie;
		}

		hSessionBosh.prototype = {

			options: null,
			callback: null,
			conn: null,
			suscribed: false,
			pubsub: null,
			msgReceivedCount: 0,
			currentStatus: null,
			callbackCookie: null,

			connect: function() {
				//Create a Strophe connection
                var content = this.options.gateway.bosh.endpoint.value.split(/(\w+:\/\/[\w\.]+)(.*)/);
                this.options.gateway.bosh.endpoint.value = content[1] + ':' + this.options.gateway.port + content[2];

				this.conn = new Strophe.Connection(this.options.gateway.bosh.endpoint.value);
				this.conn.rawInput = this.rawInput.bind(this);
				this.conn.rawOutput = this.rawOutput.bind(this);
				//Build the pubsub var
				this.pubsub =  "pubsub." + this.options.domain.value;
				
				//Call and establih the connect method from Strophe file
				this.conn.connect(
						this.options.username.value, 
						this.options.password.value, 
						this.onConnect.bind(this), 
						null,
						null, 
						null);
				
				return this;

			},
			
			//Callback using to test the connection's status. 
			//When you are connected, you should send a presence to the server and send the callback to retrieve the stanza
			onConnect: function(status)
			{
				if (status == Strophe.Status.CONNECTING) {
					console.log('Strophe is connecting.');
				} else if (status == Strophe.Status.CONNFAIL) {
					console.log('Strophe failed to connect.');
					this.currentStatus("Failed to connect");
				} else if (status == Strophe.Status.DISCONNECTING) {
					console.log('Strophe is disconnecting.');
				} else if (status == Strophe.Status.DISCONNECTED) {
					console.log('Strophe is disconnected.');
					this.currentStatus("Disconnected");
				} else if (status == Strophe.Status.CONNECTED) {
					console.log('Strophe is connected. Sending presence.');
					this.currentStatus("Connected");
					this.conn.send($pres());
					console.log('Adding Handler');
					this.conn.addHandler(this.handleMessage.bind(this),null, 'message', null, null, null, {matchBare: true});
				}
			},
			
			//Callback using to retrieve the message
			handleMessage: function(stanza) {
				console.log('stanza',stanza);
				this.msgReceivedCount++;

				var server = "^" + this.pubsub.replace(/\./g, "\\.");
				
				var re = new RegExp(server);
				
				if ($(stanza).attr('from').match(re)){ 
					var _data = $(stanza).children('event')
						.children('items')
						.children('item')
						.children('entry').text();
				}
				
				//Calling client callback with the extracted message
				this.callback(_data);
				
				return true;
			},
			
			disconnect: function() {
				this.conn.flush();
				this.conn.disconnect();
			},

			subscribe: function(nodeName){
				this.conn.pubsub.subscribe(
					this.options.username.value,
					this.pubsub,
					nodeName,
					[],
					this.handleMessage, 
					this.on_subscribe);
				this.suscribed = true;
				console.log("Subscribed to", nodeName, "well done");
			},
			
			//Callback for the subscribe function
			on_subscribe: function () {
				this.subscribed = true;
				console.log("Now awaiting messages...");
				return true;
			},
			
			//Callback for the unsubscribe function
			on_unsubscribe: function () {
				this.subscribed = false;
				return true;
			},
			
			unsubscribe : function(nodeName, subID){
				this.conn.pubsub.unsubscribe(
					this.options.username.value,
					this.pubsub,
					nodeName,
					this.on_unsubscribe);
				this.suscribed = false;
				console.log("Unsubscribed to", nodeName, "well done");
			},
			
			publish : function(nodeName,items){
				this.conn.pubsub.publish(
					this.options.username.value,
					this.pubsub,
					nodeName,
					items,
					this.callback);
					console.log("Publish Succeed");
			},
			
			rawInput: function(data)
			{
				//winston.debug("\nReceived:", data);
                // set cookies with session data every time the client send a request
                this.callbackCookie();
				return;
			},

			rawOutput: function(data)
			{
				//winston.debug("\nSent:", data);
				return;
			},
			
			getJID: function(){
                return this.conn.jid;
            },

            getSID: function(){
                return this.conn.sid;
            },

            getRID: function(){
                return this.conn.rid;
            }
		}
		
		//This return is a requireJS way which allow other files to import this specific variable 
		return{
			hSessionBosh : hSessionBosh
		}
	}
);