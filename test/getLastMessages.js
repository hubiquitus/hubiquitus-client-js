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

var channel = 'chan' + Math.floor(Math.random()*10000);
var user = conf.logins[0];

var msgQuantity = 0;

describe('#getLastMessages()', function() {

    var inactiveChannel = 'chan' + Math.floor(Math.random()*10000);
    var notInPartChannel = 'chan' + Math.floor(Math.random()*10000);

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
        hClient.getLastMessages(channel, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            hResult.result.should.be.an.instanceof(Array).and.have.lengthOf(msgQuantity);
            done();
        })
    })

    it('should return a hResult with NOT_AUTHORIZED status if user not in participants list', function(done){
        hClient.getLastMessages(notInPartChannel, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hResult.result.should.be.a('string');
            done();
        })
    })

    it('should return a hResult with NOT_AUTHORIZED status if channel is inactive', function(done){
        hClient.getLastMessages(inactiveChannel, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hResult.result.should.be.a('string');
            done();
        })
    })

    it('should return a hResult with NOT_AVAILABLE status if channel does not exist', function(done){
        hClient.getLastMessages('this chan does not exist', undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            done();
        })
    })

    it('should return a hResult with MISSING_ATTR status if channel was not sent', function(done){
        hClient.getLastMessages(undefined, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            hResult.result.should.be.a('string');
            done();
        })
    })

})

describe('#getLastMessages()', function() {

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        hClient.publish(hClient.buildMessage(channel, undefined, undefined, {transient: false}), function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            msgQuantity++;
            done();
        })
    })

    it('should return an array of messages with length old+1 after a persistent message is published', function(done){
        hClient.getLastMessages(channel, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            hResult.result.should.be.an.instanceof(Array).and.have.lengthOf(msgQuantity);
            done();
        })
    })

})

describe('#getLastMessages()', function() {

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        hClient.publish(hClient.buildMessage(channel, undefined, undefined, {transient: true}), function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        })
    })

    it('should return an array of messages with old length after a transient message is published', function(done){
        hClient.getLastMessages(channel, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            hResult.result.should.be.an.instanceof(Array).and.have.lengthOf(msgQuantity);
            done();
        })
    })

})

describe('#getLastMessages()', function() {

    var chanWithHeader = 'chan' + Math.floor(Math.random()*10000);
    var msgInChanHeader= 0;
    var maxMsgRetrieval = 14;

    before(conf.connect)

    after(conf.disconnect)

    //Create channel with msg quantity in header
    before(function(done){
        hClient.command({
            entity: conf.hNode,
            cmd: 'hcreateupdatechannel',
            params:{
                chid: chanWithHeader,
                host: 'test',
                owner: user.login,
                participants: [user.login],
                active: true,
                headers: [{hKey: 'maxMsgRetrieval', hValue: ''+maxMsgRetrieval}]
            }
        }, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        })
    })

    before(function(done){
        var counter = 0;
        for(var i = 0; i < 20; i++)
            hClient.publish(hClient.buildMessage(channel, undefined, undefined, {transient: false}), function(hResult){
                hResult.status.should.be.eql(hClient.hResultStatus.OK);
                msgQuantity++;
                if(++counter == 20)
                    done();
            })
    })

    before(function(done){
        var counter = 0;
        for(var i = 0; i < 20; i++)
            hClient.publish(hClient.buildMessage(chanWithHeader, undefined, undefined, {transient: false}), function(hResult){
                hResult.status.should.be.eql(hClient.hResultStatus.OK);
                msgInChanHeader++;
                if(++counter == 20)
                    done();
            })
    })

    it('should return msg quantity specified in headers if not specified in function', function(done){
        hClient.getLastMessages(chanWithHeader, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            hResult.result.should.be.an.instanceof(Array).and.have.lengthOf(maxMsgRetrieval);
            done();
        })
    })

    it('should return msg quantity specified in function even if specified in channel headers', function(done){
        hClient.getLastMessages(chanWithHeader, 5, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            hResult.result.should.be.an.instanceof(Array).and.have.lengthOf(5);
            done();
        })
    })

    it('should return msg quantity specified in ref if nothing is defined in function or channel', function(done){
        hClient.getLastMessages(channel, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            hResult.result.should.be.an.instanceof(Array).and.have.lengthOf(10);
            done();
        })
    })


    it('should return msg quantity specified in function if nothing defined in channel (not default from ref)', function(done){
        hClient.getLastMessages(channel, 7, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            hResult.result.should.be.an.instanceof(Array).and.have.lengthOf(7);
            done();
        })
    })

})

describe('#getLastMessages()', function() {

    it('should return a hResult status NOT_CONNECTED if trying getLastMessages while not connected', function(done){
        hClient.getLastMessages(channel, undefined, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})