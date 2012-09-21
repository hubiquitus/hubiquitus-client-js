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

var should = require('should');
var conf = require('./testConfig.js');
var hClient = require('../hubiquitus.js').hClient;

describe('#getRelevantMessages()', function(){

    var nbMsgs = 10;
    var activeChan = conf.GetValidChJID();
    var notInPart = conf.GetValidChJID();
    var inactiveChan = conf.GetValidChJID();
    var emptyChannel = conf.GetValidChJID();
    var user = conf.logins[0];


    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(activeChan, user.login, [user.login], true, done);
    })

    for(var i = 0; i < nbMsgs; i++)
        before(function(done){
            hClient.send(hClient.buildMessage(activeChan, undefined, undefined,
                {   persistent: true,
                    relevance: new Date( new Date().getTime() + 1000000 ),
                    timeout: 30000}), function(a){
                a.payload.status.should.be.eql(hClient.hResultStatus.OK);
                done(); });
        })

    for(var i = 0; i < nbMsgs; i++)
        before(function(done){
            hClient.send(hClient.buildMessage(activeChan, undefined, undefined,
                {   persistent: true,
                    relevance: new Date( new Date().getTime() - 100000 ),
                    timeout: 30000}), function(a){
                a.payload.status.should.be.eql(hClient.hResultStatus.OK);
                done(); });
        })

    for(var i = 0; i < nbMsgs; i++)
        before(function(done){
            hClient.send(hClient.buildMessage(activeChan, undefined, undefined, {persistent: true, timeout: 30000}), function(a){
                a.payload.status.should.be.eql(hClient.hResultStatus.OK);
                done(); });
        })

    before(function(done){
        conf.createChannel(emptyChannel, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(notInPart, user.login, ['a@b.com'], true, done);
    })

    before(function(done){
        conf.createChannel(inactiveChan, user.login, [user.login], false, done);
    })


    it('should return hResult error MISSING_ATTR if actor is missing', function(done){
        try {
            hClient.getLastMessages(undefined, function(hMessage){} )
        } catch (error) {
            should.exist(error.message);
            done();
        }
    })

    it('should return hResult error INVALID_ATTR if actor is not a string', function(done){
        hClient.getRelevantMessages([], function(hMessage){
            hMessage.payload.should.have.property('status', hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.match(/actor/);
            done();
        });
    })

    it('should return hResult error NOT_AVAILABLE if channel was not found', function(done){
        hClient.getRelevantMessages('#not a valid channel@localhost', function(hMessage){
            hMessage.payload.should.have.property('status', hClient.hResultStatus.NOT_AVAILABLE);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult error NOT_AUTHORIZED if not in subscribers list', function(done){
        hClient.getRelevantMessages(notInPart, function(hMessage){
            hMessage.payload.should.have.property('status', hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult error NOT_AUTHORIZED if channel is inactive', function(done){
        hClient.getRelevantMessages(inactiveChan, function(hMessage){
            hMessage.payload.should.have.property('status', hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult OK with an array of valid messages and without msgs missing relevance', function(done){
        hClient.getRelevantMessages(activeChan, function(hMessage){
            hMessage.payload.should.have.property('status', hClient.hResultStatus.OK);
            hMessage.payload.result.length.should.be.eql(nbMsgs);
            for(var i = 0; i < hMessage.payload.result.length; i++)
                new Date(hMessage.payload.result[i].relevance).getTime().should.be.above(new Date().getTime());
            done();
        });
    })

    it('should return hResult OK with an empty array if no matching msgs found', function(done){
        hClient.getRelevantMessages(emptyChannel, function(hMessage){
            hMessage.payload.should.have.property('status', hClient.hResultStatus.OK);
            hMessage.payload.result.length.should.be.eql(0);
            done();
        });
    })

})