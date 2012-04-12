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

function connect(){
    var endpoint = document.getElementById('endpoint').value;
    var endpoints = endpoint ? [endpoint] : undefined;

    var transports =  document.getElementsByName('transport');
    var transport = undefined;
    for (var i in transports)
        if(transports[i].checked)
            transport = transports[i].value;

    var hOptions = {
        serverHost: document.getElementById('serverHost').value,
        serverPort: document.getElementById('serverPort').value,
        transport: transport,
        endpoints: endpoints
    };

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    hClient.connect(username, password, hCallback, hOptions);
}

function disconnect(){
    hClient.disconnect();
}

function publish(){
    var chid = document.getElementById('chid').value;
    var msg = document.getElementById('hMessage').value;
    hClient.publish(chid, msg);
}

function subscribe(){
    var chid = document.getElementById('chid').value;
    hClient.subscribe(chid)
}

function unsubscribe(){
    var chid = document.getElementById('chid').value;
    hClient.unsubscribe(chid)
}

function get_messages(){
    var chid = document.getElementById('chid').value;
    hClient.getMessages(chid)
}

function clear_divs(){
    document.getElementById("status").innerHTML = '';
    document.getElementById("fetched").innerHTML = '';
}

function hCallback(msg){
    console.log(JSON.stringify(msg));
    var status;
    if(msg.type == 'hStatus'){
        switch(msg.data.status){
            case hClient.status.CONNECTED:
                status = 'Connected';
                break;
            case hClient.status.CONNECTING:
                status = 'Connecting';
                break;
            case hClient.status.REATTACHING:
                status = 'Reattaching';
                break;
            case hClient.status.REATTACHED:
                status = 'Reattached';
                break;
            case hClient.status.DISCONNECTING:
                status = 'Disconnecting';
                break;
            case hClient.status.DISCONNECTED:
                status = 'Disconnected';
                break;
            case hClient.status.ERROR:
                status = 'Error';
                break;
        }
        document.getElementById("status").innerHTML = JSON.stringify(status);
    }
    else if (msg.context == 'message')
        document.getElementById("fetched").innerHTML = msg.data.message;
}
