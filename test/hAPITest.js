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

//Callback to be used for each test. In each one, set before making a call
//hCallback = function(msg){<testCode>}
var hCallback;

describe('Normal Functional Tests', function() {
    //This channel will be used for all the tests
    var channel = 'chan' + Math.floor(Math.random()*10000);
    var hNode = conf.hNode;
    var user = conf.logins[0];


    before(function(done) {
        var callback = function(msg){ hCallback(msg); };
        hCallback = function(msg){
            if (msg.type == 'hStatus' && msg.data.status == hClient.status.CONNECTED)
                done();
        };

        hClient.connect(user.login, user.password, callback, conf.hOptions);
    })


    after(function(done){
        hCallback = function(msg){
            if (msg.type == 'hStatus' && msg.data.status == hClient.status.DISCONNECTED)
                done();
        };

        hClient.disconnect();
    })


    describe('#createChannelTest()', function() {
        it('should return hResult status OK and result empty', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    should.not.exist(msg.data.result);
                    done();
                }
            };
            var hCommandCreateChannel = {
                entity: hNode,
                cmd: "hcreateupdatechannel",
                params:{
                    chid: channel,
                    host:"test",
                    owner: hClient.publisher,
                    participants: [hClient.publisher],
                    active: true
                }
            };
            hClient.command(hCommandCreateChannel);
        })
    })


    describe('#getChannelsTest()', function() {
        it('should return hResult status OK and the channel in the list', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    should.exist(msg.data.result);
                    msg.data.result.should.be.an.instanceOf(Array);
                    var chids = [];
                    for(var i = 0; i < msg.data.result.length; i++)
                        chids.push(msg.data.result[i].chid)
                    chids.should.include(channel);
                    done();
                }
            };
            var hCommandGetChannels = {entity: hNode, cmd: "hgetchannels"};
            hClient.command(hCommandGetChannels);
        })
    })


    describe('#subscribeTest()', function() {
        it('should return hResult status OK and result empty', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    should.not.exist(msg.data.result);
                    done();
                }
            }
            hClient.subscribe(channel);
        })

        it('should return hResult status NOT_AUTHORIZED and result be a message', function(done) {
            hCallback= function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.NOT_AUTHORIZED);
                    should.exist(msg.data.result);
                    msg.data.result.should.be.a('string');
                    done();
                }
            };
            hClient.subscribe("notexist");
        })
    })


    describe('#getSubscriptionsTest()', function() {
        it('should return the channel called in the result', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.result.should.include(channel);
                    done();
                }
            };
            var hCommandGetSubscriptions = {entity: hNode, cmd: "hgetsubscriptions"};
            hClient.command(hCommandGetSubscriptions);
        })
    })


    describe('#publishHMessageTestHResultAndHMessage()', function() {
        it('should return hResult status ok, result empty and a correct hMessage', function(done) {
            var counter = 0;
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    should.not.exist(msg.data.result);
                    counter++;

                } else if(msg.type == 'hMessage') {
                    msg.data.chid.should.be.equal(channel);
                    msg.data.convid.should.be.equal( msg.data.msgid );
                    msg.data.type.should.be.equal("String");
                    msg.data.payload.should.be.eql("this is an HMessage");
                    counter++;
                }
                if(counter == 2)
                    done();
            };
            hClient.publish(hClient.buildMessage(channel, "String", "this is an HMessage" ));
        })
    })


    describe('#publishNotTransientHMessageTestHResultAndHMessage()', function() {
        it('should return hResult status ok, result empty and a correct hMessage', function(done) {
            var counter = 0;
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    counter++;

                } else if(msg.type == 'hMessage') {
                    msg.data.chid.should.be.equal(channel);
                    msg.data.convid.should.be.equal( msg.data.msgid );
                    msg.data.type.should.be.equal("String");
                    msg.data.payload.should.be.eql("this is an HMessage not transient");
                    counter++;
                }
                if(counter == 2)
                    done();
            };
            hClient.publish(hClient.buildMessage(channel, "String", "this is an HMessage not transient", {transient: false} ));
        })
    })


    describe('#getLastMessagesTest()', function() {
        it('should return hResult status OK and result include last payload', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    should.exist(msg.data.result);
                    msg.data.result.should.be.an.instanceOf(Array);
                    msg.data.result.length.should.be.equal(1);
                    msg.data.result[0].payload.should.be.eql("this is an HMessage not transient");
                    done();
                }
            };
            hClient.getLastMessages(channel, 1);
        })
    })


    describe('#publishWrongHMessage()', function() {
        it('should return hResult status MISSING_ATTR and result be a string', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.MISSING_ATTR);
                    should.exist(msg.data.result);
                    msg.data.result.should.be.a('string');
                    done();
                }
            };
            hClient.publish("this is a string, not an hMessage" );
        })
    })


    describe('#publishHMeasureTestHResultAndHMessage()', function() {
        it('should return hResult status ok and correct hMessage with type hMeasure', function(done) {
            var counter = 0;
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    counter++;

                } else if(msg.type == 'hMessage') {
                    msg.data.chid.should.be.equal(channel);
                    msg.data.convid.should.be.equal( msg.data.msgid );
                    msg.data.type.should.be.equal("hMeasure");
                    msg.data.payload.should.be.eql({ unit: 'g', value: 230 });
                    counter++;
                }
                if(counter == 2)
                    done();
            };
            hClient.publish(hClient.buildMeasure(channel, 230, "g"));
        })
    })


    describe('#publishHAlertTestHMessageandHResult()', function() {
        it('should return hMessage publish ok and hMessage with correct type hAlert', function(done) {
            var counter = 0;
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    counter++;

                }else if(msg.type == 'hMessage') {
                    msg.data.chid.should.be.equal(channel);
                    msg.data.convid.should.be.equal( msg.data.msgid );
                    msg.data.type.should.be.equal("hAlert");
                    msg.data.payload.should.be.eql({ alert: 'this is an Alert !!!' });
                    counter++;
                }
                if(counter == 2)
                    done();
            };
            hClient.publish(hClient.buildAlert(channel, "this is an Alert !!!"));
        })
    })


    describe('#publishHAckTestHMessage()', function() {
        it('should return hResult status ok and correct hMessage with type hAck', function(done) {
            var counter = 0;
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    should.not.exist(msg.data.result);
                    counter++;

                }else if(msg.type == 'hMessage') {
                    msg.data.chid.should.be.equal(channel);
                    msg.data.convid.should.be.equal( msg.data.msgid );
                    msg.data.type.should.be.equal("hAck");
                    msg.data.payload.should.be.eql({ ackid: '123456', ack: 'recv' });
                    counter++;
                }
                if(counter == 2)
                    done();
            };
            hClient.publish(hClient.buildAck(channel, "123456", "recv"));
        })
    })


    describe('#NonExistentCommandTest()', function() {
        it('should return hResult status NOT_AVAILABLE', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.NOT_AVAILABLE);
                    done();
                }
            };
            var nonExistentCommand = {entity: hNode, cmd: "nonExistentCommand"};
            hClient.command(nonExistentCommand);
        })
    })


    describe('#unsubscribeTest()', function() {
        it('should return hResult status NOT_AUTHORIZED and result be a string', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.NOT_AUTHORIZED);
                    should.exist(msg.data.result);
                    msg.data.result.should.be.a('string');
                    done();
                }
            };
            hClient.unsubscribe("nonExistentChannel");
        })


        it('should return hResult status OK', function(done) {
            hCallback = function(msg){
                if(msg.type == 'hResult') {
                    msg.data.status.should.be.equal(hClient.hResultStatus.OK);
                    done();
                }
            };
            hClient.unsubscribe(channel);
        })
    })

})