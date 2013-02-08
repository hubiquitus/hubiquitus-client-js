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

var should = require("should");
var conf = require('./testConfig.js');
var hClient = require('../hubiquitus.js').hClient;

describe('#getThreads()', function() {
    var activeChannel = "urn:localhost:channel1",
        notInPartChannel = "urn:localhost:channel2",
        status = Math.floor(Math.random()*10000),
        shouldNotAppearConvids = [],
        shouldAppearConvids = [],
        initialConvids = [];

    before(conf.connect)

    after(conf.disconnect)


    for(var i = 0; i < 10; i++)
        before(function(done){
            hClient.send(hClient.buildMessage(activeChannel, undefined, undefined, {persistent: true, timeout: 30000}), function(hMessage){
                hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
                initialConvids.push(hMessage.payload.result.convid);
                done();
            });

        })

    //Root messages with different status
    for(var i = 0; i < 2; i++)
        before(function(done){
            hClient.send(hClient.buildConvState(activeChannel, initialConvids.pop(), 'status' + Math.floor(Math.random()*10000),
                {persistent: true, timeout: 30000}), function(hMessage){
                hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
                shouldNotAppearConvids.push(hMessage.payload.result.convid);
                done();
            })
        })

    //Change state of one of the previous convstate to a good one
    before(function(done){
        hClient.send(hClient.buildConvState(activeChannel, shouldNotAppearConvids.pop(), status,
            {persistent: true, timeout: 30000}), function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            shouldAppearConvids.push('' + hMessage.payload.result.convid);
            done();
        })
    })

    //Add a new conversation with good status
    before(function(done){
        hClient.send(hClient.buildConvState(activeChannel, initialConvids.pop(), status,
            {persistent: true, timeout: 30000}), function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            shouldAppearConvids.push('' + hMessage.payload.result.convid);
            done();
        })
    })

    it('should return status OK with empty array if no messages with sent status', function(done){
        hClient.getThreads(activeChannel, '' + Math.floor(Math.random()*10000), function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(0);
            done();
        })
    })

    it('should return status OK with array with all convids that correspond to the status sent', function(done){
        hClient.getThreads(activeChannel, status, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            for(var i = 0; i < shouldAppearConvids.length; i++)
                hMessage.payload.result.should.include(shouldAppearConvids[i]);
            done();
        })
    })

    it('should return status OK with array without elements that HAD the status but then changed', function(done){
        hClient.getThreads(activeChannel, status, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            for(var i = 0; i < shouldNotAppearConvids.length; i++)
                hMessage.payload.result.should.not.include(shouldNotAppearConvids[i]);
            done();
        })
    })

    it('should return status error NOT_AUTHORIZED if sender not in subscribers list', function(done){
        hClient.getThreads(notInPartChannel, status, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            done();
        })
    })

    it('should return status error MISSING_ATTR if actor is not passed', function(done){
        hClient.getThreads(undefined, status, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            done();
        })
    })

    it('should return status error MISSING_ATTR if status is not passed', function(done){
        hClient.getThreads(activeChannel, undefined, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            done();
        })
    })

    it('should return status error MISSING_ATTR if actor is not a string', function(done){
        hClient.getThreads([], status, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            done();
        })
    })

    it('should return status error INVALID_ATTR if status is not a string', function(done){
        hClient.getThreads(activeChannel, [], function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            done();
        })
    })

    it('should return status error NOT_AVAILABLE if actor does not correspond to a valid hChannel', function(done){
        hClient.getThreads('urn:localhost:unknowChan', status, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            done();
        })
    })

})

describe('#getThreads()', function() {

    it('should return a hResult with status NOT_CONNECTED if user tries to getThreads while disconnected', function(done){
        hClient.getThreads('urn:localhost:unknowChan', 'this is not a good status', function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})

