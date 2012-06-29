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

//Sets a listener for incoming real time messages
hClient.onMessage = function(hMessage){
    console.log('Received a message', hMessage);
};

//Sets a listener for real time status
hClient.onStatus = function(hStatus){
    console.log('New Status', hStatus);

    if(hStatus == hClient.statuses.CONNECTED)
        console.log('You are connected, now you can execute commands. Look at the browser example!');
};

// Starts a connection to the XMPP Server using passed options.
hClient.connect('publisher', 'password', hOptions);
