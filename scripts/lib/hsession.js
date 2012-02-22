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
	['lib/transports/bosh/hsession-bosh', 'lib/transports/socketio/hsession-socketio'],
	function(hSessionBoshImg, hSessionSocketIOImg){
		
		console.log("hsessionBosh_var",hSessionBoshImg);
		
		var hSessionBosh = hSessionBoshImg.hSessionBosh;
        var hSessionSocketIO = hSessionSocketIOImg.hSessionSocketIO;
		
		// Constructor
		var hSession = function() {
		}
		
		// Prototype
		hSession.prototype = {
			transport: null,

			connect: function(opts, onMessage, onStatus, onCookie) 
			{
				//Test the transport value and instantiate the right one
				if(opts.gateway.transport.value=='bosh'){
					transport = new hSessionBosh(opts, onMessage, onStatus, onCookie);
				}else if(opts.gateway.transport.value=='socketio'){
					transport = new hSessionSocketIO(opts, onMessage, onStatus);
				}else{
					alert("Error, no transport");
				}
				//Establish the connection
				transport.connect();
			},
			
			disconnect: function(){
				transport.disconnect();
			},
			
			subscribe: function(nodeName){
				transport.subscribe(nodeName)
			},
			
			unsubscribe : function(nodeName, subID){
				transport.unsubscribe(nodeName, subID);
			},
			
			publish : function(nodeName, items){
				transport.publish(nodeName, items);
			},
			
			getJID: function(){
                return transport.getJID();
            },

            getSID: function(){
                return transport.getSID();
            },

            getRID: function(){
                return transport.getRID();
            }
		}
		
		//This return is a requireJS way which allow other files to import this specific variable 
		return{
			hSession : hSession
		}
	}
);
