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
var hubiquitus = require('../hubiquitus');

// Possible options are stored in lib/options.js
// To use socketIO as transport, hubiquitus-node is needed.
var options = {
    'gateway.transport' : 'socketio',
    'gateway.socketio.ports' : [8080],
    'gateway.socketio.endpoint': 'http://localhost'
};

// Starts a connection to the XMPP Server using passed options.
// Everytime the server sends a message/updates his status, the function
// will be called
hubiquitus.connect(
    'username',
    'password',
    function(msg){
        console.log(msg);},
    options
);
