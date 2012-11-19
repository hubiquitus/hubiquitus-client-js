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
var hClient = require('../hubiquitus.js').hClient;
var conf = require('./testConfig.js');

var channel = conf.GetValidChJID();
var user = conf.logins[0];

var msgQuantity = 0;

describe('#getLastMessages()', function() {

    var inactiveChannel = conf.GetValidChJID();
    var notInPartChannel = conf.GetValidChJID();

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(channel, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(inactiveChannel, user.login, [user.login], false, done);
    })

    before(function(done){
        conf.createChannel(notInPartChannel, user.login, [conf.logins[1].login], true, done);
    })

    it('should return an empty array of messages if nothing has been saved', function(done){
        hClient.getLastMessages(channel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(msgQuantity);
            done();
        })
    })

    it('should return a hResult with NOT_AUTHORIZED status if user not in subscribers list', function(done){
        hClient.getLastMessages(notInPartChannel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })

    it('should return a hResult with NOT_AUTHORIZED status if channel is inactive', function(done){
        hClient.getLastMessages(inactiveChannel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        })
    })

    it('should return a hResult with NOT_AVAILABLE status if channel does not exist', function(done){
        hClient.getLastMessages('#this chan does not exist@localhost', function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            done();
        })
    })

    it('should return a hResult with MISSING_ATTR status if channel was not sent', function(done){
        try {
            hClient.getLastMessages(undefined, function(hMessage){} )
        } catch (error) {
            should.exist(error.message);
            done();
        }
    })


})

describe('#getLastMessages()', function() {

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        var msgToPublish = hClient.buildMessage(channel, undefined, undefined, {persistent: true, timeout: 30000});
        hClient.send(msgToPublish, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            msgQuantity++;
            done();
        })
    })

    it('should return an array of messages with length old+1 after a persistent message is published', function(done){
        hClient.getLastMessages(channel, undefined, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(msgQuantity);
            done();
        })
    })

})

describe('#getLastMessages()', function() {

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        hClient.send(hClient.buildMessage(channel, undefined, undefined, {persistent: false, timeout: 30000}), function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        })
    })

    it('should return an array of messages with old length after a not persistent message is published', function(done){
        hClient.getLastMessages(channel, undefined, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(msgQuantity);
            done();
        })
    })

})

describe('#getLastMessages()', function() {

    var chanWithHeader = conf.GetValidChJID();
    var msgInChanHeader= 0;
    var maxMsgRetrieval = 14;

    before(conf.connect)

    after(conf.disconnect)

    //Create channel with msg quantity in header
    before(function(done){
        var params ={
                type: 'channel',
                actor: chanWithHeader,
                owner: user.login,
                subscribers: [user.login],
                active: true,
                headers: {'MAX_MSG_RETRIEVAL': ''+maxMsgRetrieval}
        }
        var updateChannelCmd = hClient.buildCommand(conf.hNode, 'hcreateupdatechannel', params, {timeout:30000});

        hClient.send(updateChannelCmd, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        })
    })

    before(function(done){
        var counter = 0;
        for(var i = 0; i < 20; i++)
            hClient.send(hClient.buildMessage(channel, undefined, undefined, {persistent: true, timeout: 30000}), function(hMessage){
                hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
                msgQuantity++;
                if(++counter == 20)
                    done();
            })
    })

    before(function(done){
        var counter = 0;
        for(var i = 0; i < 20; i++)
            hClient.send(hClient.buildMessage(chanWithHeader, undefined, undefined, {persistent: true, timeout: 30000}), function(hMessage){
                hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
                msgInChanHeader++;
                if(++counter == 20)
                    done();
            })
    })

    it('should return msg quantity specified in headers if not specified in function', function(done){
        hClient.getLastMessages(chanWithHeader, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(maxMsgRetrieval);
            done();
        })
    })

    it('should return msg quantity specified in function even if specified in channel headers', function(done){
        hClient.getLastMessages(chanWithHeader, 5, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(5);
            done();
        })
    })

    it('should return msg quantity specified in ref if nothing is defined in function or channel', function(done){
        hClient.getLastMessages(channel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(10);
            done();
        })
    })


    it('should return msg quantity specified in function if nothing defined in channel (not default from ref)', function(done){
        hClient.getLastMessages(channel, 7, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(7);
            done();
        })
    })

})

describe('#getLastMessages()', function() {

    var msgFiltered = 5;

    before(conf.connect)

    after(conf.disconnect)

    //Create channel with msg quantity in header
    before(function(done){
        var filter = {eq: {type: 'a type'}}
        conf.UpdateChannelFilter(channel, user.login, [user.login], true, filter, done);
    })

    before(function(done){
        var counter = 0;
        for(var i = 0; i < msgFiltered; i++)
            hClient.send(hClient.buildMessage(channel, 'a type', undefined, {persistent: true, timeout: 30000}), function(hMessage){
                hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
                if(++counter == msgFiltered)
                    done();
            })
    })

    it('should return only filtered messages if filter specified', function(done){
        hClient.getLastMessages(channel, msgFiltered, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.length(msgFiltered);
            for(var i = 0; i < hMessage.payload.result.length; i++)
                hMessage.payload.result[i].should.have.property('type', 'a type');
            done();
        })
    })

    it('should return only filtered messages with right quantity even if there are more messages', function(done){
        hClient.getLastMessages(channel, 1, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.length(1);
            for(var i = 0; i < hMessage.payload.result.length; i++)
                hMessage.payload.result[i].should.have.property('type', 'a type');
            done();
        })
    })

    it('should return only filtered messages if filter specified even if more messages are required', function(done){
        hClient.getLastMessages(channel, 1000, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.length(msgFiltered);
            for(var i = 0; i < hMessage.payload.result.length; i++)
                hMessage.payload.result[i].should.have.property('type', 'a type');
            done();
        })
    })

})

describe('#getLastMessages()', function() {

    it('should return a hResult status NOT_CONNECTED if trying getLastMessages while not connected', function(done){
        hClient.getLastMessages(channel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})