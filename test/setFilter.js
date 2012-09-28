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
var conf = require('./testConfig.js');
var hClient = require('../hubiquitus.js').hClient;

var user = conf.logins[0];
var hFilter;

describe('#setFilter()', function() {
    var activeChannel = conf.GetValidChJID(),
        inactiveChannel = conf.GetValidChJID(),
        notInPartChannel = conf.GetValidChJID();

    before(conf.connect);

    after(conf.disconnect);

    before(function(done){
        conf.createChannel(activeChannel, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(inactiveChannel, user.login, [user.login], false, done);
    })

    before(function(done){
        conf.createChannel(notInPartChannel, user.login, [], false, done);
    })

    beforeEach(function(){
        hFilter = {
            actor: activeChannel,
            filter: {}
        }
    })

    it('should return NOT_AUTHORIZED if channel inactive', function(done){
        hFilter.actor = inactiveChannel;
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })

    it('should return NOT_AUTHORIZED if user not in subscribers list', function(done){
        hFilter.actor = notInPartChannel;
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })

    it('should return MISSING_ATTR if actor is missing', function(done){
        delete hFilter.actor;
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })

    it('should return NOT_AVAILABLE if actor does not exist', function(done){
        hFilter.actor = '#this does not exist@localhost';

        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })
})

describe('#setFilter()', function() {

    it('should return a hResult with status NOT_CONNECTED if user tries to set filter while disconnected', function(done){
        hClient.setFilter({}, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})

