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
define(
	['jquery','lib/hsession'],
	function($,hSessionImg){
		
		//'session' represents the hsession file variable
		var session = new hSessionImg.hSession();
		
		console.log("hSession_var",session);
		
		var NODE_NAME = "test";
		var query = '';

		var Client = {
			connect:  function () {
					//Connection Options
					var opts = {
						username : {
							value: 'username@domain.com'
						} 
						,password : {
							value: 'password'
						} 
						,domain : {
							note: 'The xmpp domain', 
							value: 'host.com'
						}
						,route : {
							note: 'XMPP Host and port to connect to Format: host:port. (Optional. only if host != domain and port != default)',
							value: ''
						}
                        ,gateway : {
                            note: 'Values for the hubiquitus-node gateway'
                            ,server: {
                                note: 'Host of the gateway (format protocol://host)',
                                value: 'http://localhost'
                            }
                            ,transport : {
                                note: 'Transport mode to use to the gateway (bosh or socketio)',
                                value: 'socketio'
                            }
                            ,socketio: {
                                port: {
                                    note: 'socket.io listening port in the gateway',
                                    value: '8080'
                                },
                                namespace: {
                                    note: 'namespace to be used when sending messages (same than in server)',
                                    value: '/'
                                }
                            }
                            ,bosh: {
                                port : {
                                    note: 'bosh listening port in the gateway (default 5280)',
                                    value: '5280'
                                }
                            }
                        }
					};
				
				// Try to establish a connection according to a special transport mode
				session.connect(opts, Client.onMessage, Client.onStatus);
			},		
				
			// Event triggered when a message arrives
			// NB: onMessage function retrieve messages coming from all user subscried node
			onMessage: function (message) {
				
				var _data = message;
						
				if (_data) {
					Client.show_html(_data);
				}
				return true;
			},
			
			//This method permits to test the connection's status because of the asynchronous process
			onStatus: function(status){
				if(status == "Failed to connect"){
					document.getElementById("status").innerHTML = status;
				}else if (status == "Connected"){
					document.getElementById("status").innerHTML = status;
					//Client.disconnect();
					//Client.subscribe(NODE_NAME);
					//Client.unsubscribe(NODE_NAME);
					//Client.publish(NODE_NAME, query);
				}else if (status == "Disconnected"){
					document.getElementById("status").innerHTML = status;
				}
			},
			
			disconnect: function(){
				session.disconnect();
			},

			subscribe: function(nodeName){
				session.subscribe(nodeName)
			},
			
			unsubscribe : function(nodeName){
				session.unsubscribe(nodeName);
			},
			
			publish : function(nodeName, items){
				session.publish(nodeName, items);
			},

			// inject html
			show_html: function (m) {
				var e = document.createElement('div');
				e.innerHTML = m;
				document.getElementById("fetched").innerHTML = e.childNodes[0].nodeValue;
			}
		}
		
		//Connection launch
		Client.connect();
        var t = setTimeout(Client.disconnect, 25000);
    }
);
