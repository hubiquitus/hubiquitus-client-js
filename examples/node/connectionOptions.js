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

// Import the require file
var hub = require('../../hubiquitus.js');

// Look at the wiki to check possible options
// To use socketIO as transport, hubiquitus-node is needed.
var options = {
    'gateway.transport' : 'socketio',
    'gateway.socketio.ports' : [8080],
    'gateway.socketio.endpoint': 'http://localhost'
};


var callback = function(msg){
    if (msg.context == 'link' && msg.data.status == hub.status.Connected){
        console.log('Connected, Now we will receive messages');
        client.subscribe('channelID'); //Because we are connected, we can subscribe to channels
    }

    if (msg.context == 'message')
        console.log('Received a message in channel ' + msg.data.channel +
            ' with content ' + msg.data.message);
};

// Starts a connection to the XMPP Server using passed options.
// Everytime the server sends a message/updates his status, callback
// will be called
var client = hub.connect(
    'username',
    'password',
    callback,
    options
);
