/*
 * Copyright (c) Novedia Group 2012.
 *
 *    This file is part of Hubiquitus
 *
 *    Permission is hereby granted, free of charge, to any person obtaining a copy
 *    of this software and associated documentation files (the "Software"), to deal
 *    in the Software without restriction, including without limitation the rights
 *    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 *    of the Software, and to permit persons to whom the Software is furnished to do so,
 *    subject to the following conditions:
 *
 *    The above copyright notice and this permission notice shall be included in all copies
 *    or substantial portions of the Software.
 *
 *    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 *    INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 *    PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 *    FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 *    ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *    You should have received a copy of the MIT License along with Hubiquitus.
 *    If not, see <http://opensource.org/licenses/mit-license.php>.
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

    if(hStatus.status == hClient.statuses.CONNECTED)
        console.log('You are connected, now you can execute commands. Look at the browser example!');
};

// Starts a connection to the running topology using passed options.
hClient.connect('urn:localhost:user', 'urn:localhost:user', hOptions);
