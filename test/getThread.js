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

describe('#getThread()', function() {
    var activeChannel = conf.GetValidChJID(),
        inactiveChannel = conf.GetValidChJID(),
        notInPartChannel = conf.GetValidChJID(),
        convid,
        publishedMessages = 0;

    var user = conf.logins[0];

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(activeChannel, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(inactiveChannel, user.login, [user.login], false, done);
    })

    before(function(done){
        conf.createChannel(notInPartChannel, user.login, [], false, done);
    })

    //First message to get convid
    before(function(done){
        hClient.send(hClient.buildMessage(activeChannel, undefined, undefined,
            {persistent: true, timeout: 30000}), function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            convid = hMessage.payload.result.convid;
            publishedMessages++;
            done();
        })
    })

    for(var i = 0; i < 5; i++)
        before(function(done){
            hClient.send(hClient.buildMessage(activeChannel, undefined, undefined,
                {persistent: true, convid: convid, timeout: 30000}), function(hMessage){
                hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
                publishedMessages++;
                done();
            })
        })

    it('should return status OK with empty array if no messages with sent convid', function(done){
        hClient.getThread(activeChannel, '' + Math.floor(Math.random()*10000), function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(0);
            done();
        })
    })

    it('should return status OK with array with all messages with same convid sent', function(done){
        hClient.getThread(activeChannel, convid, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(publishedMessages);
            done();
        })
    })

    it('should return status error NOT_AUTHORIZED if channel is inactive', function(done){
        hClient.getThread(inactiveChannel, convid, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            done();
        })
    })

    it('should return status error NOT_AUTHORIZED if sender not in subscribers list', function(done){
        hClient.getThread(notInPartChannel, convid, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            done();
        })
    })

    it('should return status error MISSING_ATTR if actor is not passed', function(done){
        try {
            hClient.getThread(undefined, convid, function(hMessage){} )
        } catch (error) {
            should.exist(error.message);
            done();
        }
    })

    it('should return status error MISSING_ATTR if convid is not passed', function(done){
        hClient.getThread(activeChannel, undefined, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            done();
        })
    })

    it('should return status error MISSING_ATTR if actor is not a string', function(done){
        hClient.getThread([], convid, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            done();
        })
    })

    it('should return status error INVALID_ATTR if convid is not a string', function(done){
        hClient.getThread(activeChannel, [], function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            done();
        })
    })

    it('should return status error NOT_AVAILABLE if actor does not correspond to a valid hChannel', function(done){
        hClient.getThread('#this does not exist@localhost', convid, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            done();
        })
    })

})

describe('#getThread()', function() {

    it('should return a hMessage with status NOT_CONNECTED if user tries to getThread while disconnected', function(done){
        hClient.getThread('#this channel does not exist@localhost', 'this is not a convid', function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})

