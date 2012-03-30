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
    ['../../hubiquitus'],
    function(hub){

        // Starts a connection to the default XMPP Server using default transport.
        // Everytime the server sends a message/updates his status, the function
        // will be called
        var client = hub.connect('username', 'password', function(msg){
            if(msg.context == 'link')
                document.getElementById("status").innerHTML = msg.data.status;
            else if (msg.context == 'message')
                document.getElementById("fetched").innerHTML = msg.data.message;

            //If we are connected, try to subscribe to a channel
            if(msg.context == 'link' && msg.data.status == hub.status.Connected){
                client.subscribe('channelID');
            }
        });
    }
);
