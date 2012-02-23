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
	['jquery','lib/hsession', 'cookieshandling'],
	function($,hSessionImg, cookieImg){
		
		//'session' represents the hsession file variable
		var session = new hSessionImg.hSession();
		var cookie = new cookieImg.Cookie;
		
		console.log("hSession_var",session);
		
		var NODE_NAME = "";
		var query = '';

		// number of days before cookie deletion
		var cookiesValidity = 2;

        var Client = function(username, password, domain){
            this.opts.username.value = username || this.opts.username.value;
            this.opts.password.value = password || this.opts.password.value;
            this.opts.domain.value = domain || this.opts.domain.value;
        };

        Client.prototype = {
          opts: {
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
                  note: 'XMPP Host and port to connect to Format: host:port. (Only if host != domain or port != default)',
                  value: ''
              }
              ,gateway : {
                  note: 'Values for the gateway'
                  ,transport : {
                      note: 'Transport mode to use to the gateway (bosh or socketio)',
                      value: 'socketio'
                  }
                  ,socketio: {
                      host: {
                          note: 'Host of the gateway (format protocol://host)',
                          value: 'http://localhost'
                      },
                      ports: {
                          note: 'socket.io listening ports in the gateway',
                          value: [8080]
                      },
                      namespace: {
                          note: 'namespace to be used when exchanging messages',
                          value: '/'
                      }
                  }
                  ,bosh: {
                      ports: {
                          note: 'ports available for the bosh endpoint',
                          value: [5280]
                      },
                      endpoint : {
                          note: 'bosh endpoint without the port (format: http://localhost/http-bind/)',
                          value: 'http://localhost/http-bind/'
                      }
                  }
              }
          },
            connect:  function () {
                var ports = this.opts.gateway.transport.value == 'bosh' ?
                    this.opts.gateway.bosh.ports.value : this.opts.gateway.socketio.ports.value;
                this.opts.gateway.port = ports[Math.floor(Math.random()*ports.length)];
                session.connect(this.opts, this.onMessage, this.onStatus, this.onCookie);
            },

            /**
             * When a message is received by the client, do something. in this case show it in a html page
             * @param message - published message by the server
             * NB: onMessage function retrieve messages coming from all user subscribed nodes
             */
            onMessage: function (message) {
                var e = document.createElement('div');
                e.innerHTML = message;
                document.getElementById("fetched").innerHTML = e.childNodes[0].nodeValue;
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

            unsubscribe : function(nodeName, subID){
                session.unsubscribe(nodeName, subID);
            },

            publish : function(nodeName, items){
                session.publish(nodeName, items);
            },

            onCookie: function(){
                // cookies generation
                cookie.createCookie('JID', session.getConnInfo().jid, cookiesValidity);
                cookie.createCookie('SID', session.getConnInfo().sid, cookiesValidity);
                cookie.createCookie('RID', session.getConnInfo().rid, cookiesValidity);
            }
        };

        var client = new Client('username@domain.com', 'password', 'host.com');
        client.connect();
    }
);
