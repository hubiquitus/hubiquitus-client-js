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

describe('#unsetFilter()', function() {
    var activeChannel = 'chan' + Math.floor(Math.random()*10000),
        name = 'a filter name';

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(activeChannel, user.login, [user.login], true, done);
    })

    before(function(done){
        hClient.setFilter({
            name: name,
            actor: activeChannel,
            template: {priority: 2}
        }, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        })

    })

    it('should return MISSING_ATTR if name is missing', function(done){
        hClient.unsetFilter(undefined, activeChannel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })

    it('should return MISSING_ATTR if actor is missing', function(done){
        hClient.unsetFilter(name, undefined, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })

    it('should return NOT_AVAILABLE if filter does not exist', function(done){
        hClient.unsetFilter('this does not exist', activeChannel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })

    it('should return OK with correct filter', function(done){
        hClient.unsetFilter(name, activeChannel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        })
    })
})

describe('#unsetFilter()', function() {

    it('should return a hResult with status NOT_CONNECTED if user tries to remove filter while disconnected', function(done){
        hClient.unsetFilter('a filter', 'a channel', function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})

