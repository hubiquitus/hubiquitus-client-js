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

// Import hClient
var hClient = require('../../hubiquitus.js').hClient;

// Look at the wiki to check possible options
// To use socketIO as transport, hubiquitus-node is needed.
var hOptions = {
    transport : 'socketio',
    endpoints : ['http://localhost:8080/']
};


var hCallback = function(msg){
    if (msg.type == 'hStatus' && msg.data.status == hClient.status.CONNECTED){
        console.log('Connected, Now we will receive messages');
        hClient.subscribe('channelID'); //Because we are connected, we can subscribe to channels
    }

    if (msg.type == 'hMessage')
        console.log('Received a message' + JSON.stringify(msg.data));
};

// Starts a connection to the XMPP Server using passed options.
// Everytime the server sends a message/updates his status, callback
// will be called
hClient.connect('publisher', 'password', hCallback, hOptions);
