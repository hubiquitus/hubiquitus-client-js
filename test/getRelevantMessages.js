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
        hClient.getRelevantMessages(undefined, function(hMessage){
            hMessage.payload.should.have.property('status', hClient.hResultStatus.MISSING_ATTR);
            done();
        });
    })

    it('should return hResult error MISSING_ATTR if actor is not a string', function(done){
        hClient.getRelevantMessages([], function(hMessage){
            hMessage.payload.should.have.property('status', hClient.hResultStatus.MISSING_ATTR);
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