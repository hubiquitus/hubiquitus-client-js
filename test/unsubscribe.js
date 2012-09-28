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

var should = require("should");
var hClient = require('../hubiquitus.js').hClient;
var conf = require('./testConfig.js');

describe('#unsubscribe()', function() {

    var user = conf.logins[0];
    var chanActive = conf.GetValidChJID();
    var chanInactive = conf.GetValidChJID();
    var chanInactiveNotSubscribed = conf.GetValidChJID();

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(chanActive, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(chanInactive, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(chanInactiveNotSubscribed, user.login, [conf.logins[1].login], false, done);
    })

    before(function(done){
        hClient.subscribe(chanActive, function(hMessage){
            done();
        });
    })

    before(function(done){
        hClient.subscribe(chanInactive, function(hMessage){
            done();
        });
    })

    before(function(done){
        conf.createChannel(chanInactive, user.login, [user.login], false, done);
    });

    it('should return hResult status NOT_AVAILABLE and result be a message if channel does not exist', function(done) {
        hClient.unsubscribe("#This chan does not exist@localhost", function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if channel inactive and user was subscribed', function(done) {
        hClient.unsubscribe(chanInactive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if channel inactive and user not subscribed', function(done) {
        hClient.unsubscribe(chanInactiveNotSubscribed, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status MISSING_ATTR and result be a message if actor not provided', function(done) {
        try {
            hClient.unsubscribe(undefined, function(hMessage){} )
        } catch (error) {
            should.exist(error.message);
            done();
        }
    })

    it('should return hResult status OK if subscribed and in subscribers list', function(done) {
        hClient.unsubscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hClient.getSubscriptions(function(hMessage) {
                hMessage.payload.result.should.not.include(chanActive);
            });
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if user not subscribed', function(done) {
        hClient.unsubscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})

describe('#unsubscribe()', function() {

    var user = conf.logins[0];
    var chanActive = conf.GetValidChJID();

    it('should return hResult status NOT_CONNECTED and result be a message if user not connected', function(done) {
        hClient.unsubscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})

describe('#unsubscribe()', function() {

    var user = conf.logins[0];
    var chanActive = conf.GetValidChJID();

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(chanActive, user.login, [user.login], true, done);
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if user not subscribed', function(done) {
        hClient.unsubscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})


