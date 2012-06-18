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

describe('#subscribe()', function() {

    var user = conf.logins[0];
    var chanActive = 'chan' + Math.floor(Math.random()*10000);
    var chanInactive = 'chan' + Math.floor(Math.random()*10000);
    var chanNotInPart = 'chan' + Math.floor(Math.random()*10000);

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(chanActive, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(chanInactive, user.login, [user.login], false, done);
    })

    before(function(done){
        conf.createChannel(chanNotInPart, user.login, [conf.logins[1]], true, done);
    })

    it('should return hResult status NOT_AVAILABLE and result be a message if channel does not exist', function(done) {
        hClient.subscribe('chan does not exist', function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            hResult.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if channel is inactive', function(done) {
        hClient.subscribe(chanInactive, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hResult.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if user not in participants list', function(done) {
        hClient.subscribe(chanNotInPart, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hResult.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status OK if not subscribed and in participants list', function(done) {
        hClient.subscribe(chanActive, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            hClient.getSubscriptions(function(hResult) {
                hResult.result.should.include(chanActive);
            });
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if user not in participants list', function(done) {
        hClient.subscribe(chanActive, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hResult.result.should.be.a('string');
            done();
        });
    })

})

describe('#subscribe()', function() {

    var user = conf.logins[0];
    var chanActive = 'chan' + Math.floor(Math.random()*10000);

    it('should return hResult status NOT_CONNECTED and result be a message if user not connected', function(done) {
        hClient.subscribe(chanActive, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            hResult.result.should.be.a('string');
            done();
        });
    })

})