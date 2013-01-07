/**
 * This file will be used for all config tests.
 * Set this with correct values before starting the tests
 */

//Connection options
exports.hOptions = {
    transport : 'socketio',
    endpoints : ['http://localhost:8080/']
};

//Array of logins to use (some test need two users)
exports.logins = [
    {
        login: 'urn:localhost:u1',
        password: 'urn:localhost:u1'
    }
    ,{
        login: 'urn:localhost:u2',
        password: 'urn:localhost:u2'
    }
];

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////// DO NOT MODIFY BELOW THIS LINE ///////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

var should = require('should');
var hClient = require('../hubiquitus.js').hClient;

exports.connect = function(done, user, hOptions, instance){
    var client = instance || hClient;
    var login = user ? user.login : exports.logins[0].login;
    var password = user ? user.password : exports.logins[0].password;
    var opts = hOptions || exports.hOptions;
    opts.stress = instance ? true : opts.stress;

    client.onStatus = function(hStatus){
        if(hStatus.status == client.statuses.CONNECTED){
            done();
        }
    };

    client.connect(login, password, opts);
};

exports.disconnect = function(done, instance){
    var client = instance || hClient;

    client.onStatus = function(hStatus){
        if(hStatus.status == client.statuses.DISCONNECTED){
            done();
        }
    };

    client.disconnect();
};

exports.createChannel = function(actor, owner, subscribers, active, done, instance){
    var client = instance || hClient;
    var hCommandCreateChannel = {
        actor: exports.hNode,
        type: 'hcommand',
        sent: new Date(),
        timeout: 30000,
        payload: {
            cmd: "hcreateupdatechannel",
            params:{
                type: 'channel',
                actor: actor,
                owner: owner,
                subscribers: subscribers,
                active: active
            }
        }
    };
    client.send(hCommandCreateChannel, function(hMessage){
        hMessage.payload.status.should.be.eql(client.hResultStatus.OK);
        done();
    });
};

exports.UpdateChannelFilter = function(actor, owner, subscribers, active, filter, done, instance){
    var client = instance || hClient;
    var hCommandCreateChannel = {
        actor: exports.hNode,
        type: 'hcommand',
        sent: new Date(),
        timeout: 30000,
        payload: {
            cmd: "hcreateupdatechannel",
            params:{
                type: 'channel',
                actor: actor,
                owner: owner,
                subscribers: subscribers,
                active: active,
                filter: filter
            }
        }
    };
    client.send(hCommandCreateChannel, function(hMessage){
        hMessage.payload.status.should.be.eql(client.hResultStatus.OK);
        done();
    });
};

exports.GetValidChJID = function(){
    return '#Chan'+ Math.floor(Math.random()*10000)+'@localhost'
}