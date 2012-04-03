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


function hCallback(msg){
    console.log(msg);
    if (msg.context == 'hStatus' && msg.data.status == hClient.status.Connected){
        console.log('Connected, Now we will receive messages and can execute commands');
    }
}

// Starts a connection to the default XMPP Server using default transport.
// Everytime the server sends a message/updates his status, the function
// will be called
hClient.connect('publisher', 'password', hCallback);
