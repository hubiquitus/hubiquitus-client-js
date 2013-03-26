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
var mongo = require("mongodb");

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
    client = null
};

exports.dropCollection = function(done){
    var server = new mongo.Server("localhost", 27017)
    var db = new mongo.Db("test", server)

    db.open(function(err, rep) {
        if (!err) {
            db.collection("channel1").drop()
            done();
        }
    });
}