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

var callback = function(hMessage) {
    console.log("Received callback : ", hMessage);
}

function connect(){
    var endpoint = document.getElementById('endpoint').value;
    var endpoints = endpoint ? [endpoint] : undefined;

    var transports =  document.getElementsByName('transport');
    var transport = undefined;
    for (var i=0; i < transports.length; i++)
        if(transports[i].checked)
            transport = transports[i].value;

    var hOptions = {
        transport: transport,
        endpoints: endpoints
    };

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    hClient.onMessage = onMessage;
    hClient.onStatus = onStatus;
    hClient.connect(username, password, hOptions);
}

function disconnect(){
    hClient.disconnect();
}

function send(){
    var actor = document.getElementById('actor').value;
    var msg = document.getElementById('hMessage').value;

    var timeout = document.getElementById("timeout").value;
    hClient.send(hClient.buildMessage(actor, 'string', msg, {
        persistent: !!document.getElementById("hMessagePersistent").checked,
        timeout: parseInt(timeout)
    }), callback);
}

function subscribe(){
    var actor = document.getElementById('actor').value;
    hClient.subscribe(actor, callback)
}

function unsubscribe(){
    var actor = document.getElementById('actor').value;
    hClient.unsubscribe(actor, callback)
}

function get_subscriptions(){
    hClient.getSubscriptions(callback);
}

function clear_divs(){
    document.getElementById("status").innerHTML = 'Status: ';
    document.getElementById("fetched").innerHTML = '';
}

function send_hEcho(){
    if( hClient.status != hClient.statuses.CONNECTED )
        alert('Please connect before trying to send an hEcho');
    else{
        var value = prompt('Your Name:');
        var msgOptions = {};
        msgOptions.persistent = !!document.getElementById("persistentCheckBox").checked;
        msgOptions.timeout = document.getElementById("timeout").value;
        var hMessage = hClient.buildCommand('hnode@' + hClient.domain, 'hEcho', {hello : value}, msgOptions);
        hMessage.actor = hClient.fulljid;
        hClient.send(hMessage, callback);
    }

}

function setFilter(){
    var value = prompt('Value of the filter:');
    eval('var filter ='+value);

    hClient.setFilter(filter, callback);
}

function onStatus(hStatus){
    console.log('Received hStatus', hStatus);
    var status,error;

    switch(hStatus.status){
        case hClient.statuses.CONNECTED:
            status = 'Connected';
            break;
        case hClient.statuses.CONNECTING:
            status = 'Connecting';
            break;
        case hClient.statuses.DISCONNECTING:
            status = 'Disconnecting';
            break;
        case hClient.statuses.DISCONNECTED:
            status = 'Disconnected';
            break;
    }

    switch(hStatus.errorCode){
        case hClient.errors.NO_ERROR:
            error = 'No Error Detected';
            break;
        case hClient.errors.URN_MALFORMAT:
            error = 'URN Malformat';
            break;
        case hClient.errors.CONN_TIMEOUT:
            error = 'Connection timed out';
            break;
        case hClient.errors.AUTH_FAILED:
            error = 'Authentication failed';
            break;
        case hClient.errors.ALREADY_CONNECTED:
            error = 'A connection is already opened';
            break;
        case hClient.errors.TECH_ERROR:
            error = 'Technical Error: ';
            error += hStatus.errorMsg;
            break;
        case hClient.errors.NOT_CONNECTED:
            error = 'Not connected';
            break;
        case hClient.errors.CONN_PROGRESS:
            error = 'A connection is already in progress';
            break;
    }

    document.getElementById("status").innerHTML = 'Status: ' + status + ' / ' + error;
}

function onMessage(hMessage){
    console.log('Received hMessage', hMessage);
    document.getElementById("fetched").innerHTML = JSON.stringify(hMessage);
}