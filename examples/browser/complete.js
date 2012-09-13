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
        serverHost: document.getElementById('serverHost').value,
        serverPort: document.getElementById('serverPort').value,
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
    var relevance;
    var actor = document.getElementById('actor').value;
    var msg = document.getElementById('hMessage').value;

    if(document.getElementById("relevanceOn").checked)
        relevance = parseInt(prompt('Relevance Offset:'));

    var timeout = document.getElementById("timeout").value;
    hClient.send(hClient.buildMessage(actor, 'string', msg, {
        persistent: !!document.getElementById("hMessagePersistent").checked,
        headers: { RELEVANCE_OFFSET: relevance},
        timeout: timeout
    }), callback);
}

function relevantMessages(){
    var actor = document.getElementById('actor').value;
    hClient.getRelevantMessages(actor, callback);
}

function subscribe(){
    var actor = document.getElementById('actor').value;
    hClient.subscribe(actor, callback)
}

function unsubscribe(){
    var actor = document.getElementById('actor').value;
    hClient.unsubscribe(actor, callback)
}

function get_messages(){
    var actor = document.getElementById('actor').value;
    var quantity = prompt('Max Messages (can be empty):');
    hClient.getLastMessages(actor, quantity, callback);
}

function get_subscriptions(){
    hClient.getSubscriptions(callback);
}

function clear_divs(){
    document.getElementById("status").innerHTML = 'Status: ';
    document.getElementById("fetched").innerHTML = '';
}

function send_hEcho(){
    if( hClient.status != hClient.statuses.CONNECTED && hClient.status != hClient.statuses.REATTACHED )
        alert('Please connect before trying to send an hEcho');
    else{
        var value = prompt('Your Name:');
        var msgOptions = {};
        msgOptions.persistent = !!document.getElementById("persistentCheckBox").checked;
        msgOptions.timeout = document.getElementById("timeout").value;
        var hMessage = hClient.buildCommand('hnode@' + hClient.domain, 'hEcho', {hello : value}, msgOptions);
        hClient.send(hMessage, callback);
    }

}

function getThread(){
    var actor = prompt('Channel to search the messages:');
    var convid = prompt('Convid to recover:');

    hClient.getThread(actor, convid, callback);
}

function createChannel(){
    var actor = prompt('Channel to create:');
    var subscribers = prompt('Subscriber to the channel :');

    var params = {owner: document.getElementById('username').value, actor: actor, subscribers: subscribers.split(","), active: true};
    var hMessage = hClient.buildCommand(hClient.hOptions.hServer + '@' + hClient.domain, 'hCreateUpdateChannel', params);
    hClient.send(hMessage, callback);
}

function getThreads(){
    var actor = prompt('Channel to search the hConvStates:');
    var status = prompt('Matching status to recover:');

    hClient.getThreads(actor, status, callback);
}

function listFilters(){
    var actor = document.getElementById('actor').value;
    actor = actor != '' ? actor : undefined;
    hClient.listFilters(actor, callback);
}

function setFilter(){
    var name = prompt('Filter Name:');
    var attr = prompt('Attribute to filter:');
    var value = prompt('Value of the attribute:');
    var filterTemplate = {
        name: name,
        actor: document.getElementById('actor').value,
        template: {}
    };
    filterTemplate.template[attr] = value;

    hClient.setFilter(filterTemplate, callback);
}

function unsetFilter(){
    var name = prompt('Filter Name:');

    hClient.unsetFilter(name, document.getElementById('actor').value, callback);
}

function build_measure(){
    var value = prompt('Value:');
    var unit = prompt('Unit:');
    var actor = prompt('Channel:');
    var hMessage = hClient.buildMeasure(actor, value, unit, {
        persistent: !!document.getElementById("hMessagePersistent").checked
    });
    if(hMessage)
        console.log('Created hMessage', hMessage);
    if(document.getElementById("sendBuiltMessage").checked)
        hClient.send(hMessage, callback);
}

function build_alert(){
    var alert = prompt('Alert:');
    var actor = prompt('Channel:');
    var hMessage = hClient.buildAlert(actor, alert, {
        persistent: !!document.getElementById("hMessagePersistent").checked
    });
    if(hMessage)
        console.log('Created hMessage', hMessage);
    if(document.getElementById("sendBuiltMessage").checked)
        hClient.send(hMessage, callback);
}

function build_ack(){
    var ackID = prompt('AckID:');
    var ack= prompt('Ack (recv|read):');
    var actor = prompt('Channel:');
    var hMessage = hClient.buildAck(actor, ackID, ack, {
        persistent: !!document.getElementById("hMessagePersistent").checked
    });
    if(hMessage)
        console.log('Created hMessage', hMessage);
    if(document.getElementById("sendBuiltMessage").checked)
        hClient.send(hMessage, callback);
}

function build_convstate(){
    var actor = prompt('Channel:');
    var convid = prompt('Convid:');
    var status = prompt('Status:');
    var hMessage = hClient.buildConvState(actor, convid, status, {
        persistent: !!document.getElementById("hMessagePersistent").checked
    });
    if(hMessage)
        console.log('Created hMessage', hMessage);
    if(document.getElementById("sendBuiltMessage").checked)
        hClient.send(hMessage, callback);
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
        case hClient.statuses.REATTACHING:
            status = 'Reattaching';
            break;
        case hClient.statuses.REATTACHED:
            status = 'Reattached';
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
        case hClient.errors.JID_MALFORMAT:
            error = 'JID Malformat';
            break;
        case hClient.errors.CONN_TIMEOUT:
            error = 'Connection timed out';
            break;
        case hClient.errors.AUTH_FAILED:
            error = 'Authentication failed';
            break;
        case hClient.errors.ATTACH_FAILED:
            error = 'Attach failed';
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