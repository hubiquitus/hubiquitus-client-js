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

var HClient = require('../hubiquitus.js').HClient;


describe('#publish()', function() {

    var user1 = conf.logins[0];
    var user2 = conf.logins[1];

    var chanActive = "urn:localhost:channel1";

    var msgCreatedOffline;

    var hClient1 = new HClient();
    var hClient2 = new HClient();

    beforeEach(function(done) {
        hClient1 = new HClient();

        hClient1.onStatus = function(hStatus) {
            if(hStatus.status === hClient1.statuses.CONNECTED)
                done();
        };
        hClient1.connect(user1.login, user1.password, conf.hOptions);
    });

    beforeEach(function(done) {
        hClient2 = new HClient();

        hClient2.onStatus = function(hStatus) {
            if(hStatus.status === hClient2.statuses.CONNECTED)
                done();
        };
        hClient2.connect(user2.login, user2.password, conf.hOptions);
    });

    afterEach(function() {
        hClient1.disconnect();
        hClient2.disconnect();
    });

    beforeEach(function(){
        msgCreatedOffline = hClient1.buildMessage(chanActive, null, null, {timeout: 30000});
    })

    afterEach(function(){
        hClient1.onMessage = function(hMessage){};
        hClient2.onMessage = function(hMessage){};
    })

    it('should return MISSING_ATTR if user tries to publish a null message', function(done){
        hClient2.send(undefined, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.MISSING_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return MISSING_ATTR if user tries to publish message without actor', function(done){
        var msg = hClient2.buildMessage(chanActive, undefined, undefined, {timeout: 30000});
        delete msg.actor;
        hClient2.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.MISSING_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return NOT_AVAILABLE if user tries to publish message to a channel that does not exist', function(done){
        var msg = hClient2.buildMessage('urn:localhost:unknowChan', undefined, undefined, {timeout: 30000});
        hClient2.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.NOT_AVAILABLE);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return OK if user tries to publish a message created offline', function(done){
        hClient1.send(msgCreatedOffline, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);
            done();
        });
    })

    it('should return OK if user tries to publish when in subscribers list but not subscribed and should not receive msg', function(done){
        var msg = hClient1.buildMessage(chanActive, undefined, undefined, {timeout: 30000});

        hClient1.onMessage = function(hMessage){
            hMessage.payload.publisher.should.not.be.eql(hClient1.publisher);
        };

        hClient1.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);
            setTimeout(done, 800); //Set a timeout to test if the message is received
        });
    })

    describe('when subscribed', function() {
        beforeEach(function(done) {
            hClient2.subscribe(chanActive, function(hMessage) {
                hMessage.payload.status.should.be.eql(0);
                done();
            });
        });

        beforeEach(function(done) {
            hClient1.subscribe(chanActive, function(hMessage) {
                hMessage.payload.status.should.be.eql(0);
                done();
            });
        });

        it('should receive published message by another person', function(done){
            var msg = hClient1.buildMessage(chanActive, undefined, undefined, {timeout: 30000});

            hClient2.onMessage = function(hMessage){
                hClient2.bareURN(hMessage.publisher).should.be.eql(hClient1.publisher);
                done();
            };

            hClient1.send(msg, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);
            });
        })

        it('should receive published message by ourselves if subscribed', function(done){
            var msg = hClient2.buildMessage(chanActive, undefined, undefined, {timeout: 30000});

            hClient2.onMessage = function(hMessage){
                hClient2.bareURN(hMessage.publisher).should.be.eql(hClient2.publisher);
                done();
            };

            hClient2.send(msg, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
            });
        })

        it('should receive published message and hResult when published message is persistent', function(done){
            var msg = hClient2.buildMessage(chanActive, undefined, undefined, {persistent: true, timeout: 30000});

            var counter = 0;
            hClient2.onMessage = function(hMessage){
                hClient2.bareURN(hMessage.publisher).should.be.eql(hClient2.publisher);
                if(++counter == 2)
                    done();
            };

            hClient2.send(msg, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
                if(++counter == 2)
                    done();
            });
        })
    });

    describe('#filterMessage', function(){


        it('should receive published message that passes through a filter', function(done){
            var msg = hClient1.buildMessage(chanActive, undefined, undefined, {priority: 3, timeout: 30000});
            var hFilter = {
                eq:{
                    priority: 3
                }
            };

            hClient1.subscribe(chanActive, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);

                hClient1.setFilter(hFilter, function(hMessage){
                    hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);

                    var counter = 0;
                    hClient1.onMessage = function(hMessage){
                        hClient1.bareURN(hMessage.publisher).should.be.eql(hClient1.publisher);
                        done();
                    };

                    hClient1.send(msg, function(hMessage){
                        hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);
                    });
                })
            })
        })

        it('should not receive published message that does not pass through a filter', function(done){
            var msg = hClient1.buildMessage(chanActive, undefined, undefined, {priority: 4, timeout: 30000});
            var hFilter = {
                eq:{
                    priority: 3
                }
            };

            hClient1.setFilter(hFilter, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);

                hClient1.onMessage = function(hMessage){
                    hMessage.publisher.should.not.be.eql(hClient2.publisher);
                };

                hClient2.send(msg, function(hMessage){
                    hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
                });

                setTimeout(done, 800);
            })


        })

        it('should receive published message that was filtered before but unset', function(done){
            var msg = hClient2.buildMessage(chanActive, undefined, undefined, {priority: 4, timeout: 30000});
            var hFilter = {};

            hClient2.subscribe(chanActive, function(hMessage) {
                hMessage.payload.status.should.be.eql(0);

                hClient2.setFilter(hFilter, function(hMessage){

                    hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);

                    hClient2.onMessage = function(hMessage){
                        hClient2.bareURN(hMessage.publisher).should.be.eql(hClient2.publisher);
                        done();
                    };

                    hClient2.send(msg, function(hMessage){
                        hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
                    });
                })
            });
        })
    })

    describe('#publish()', function(){

        it('should not receive published message after unsubscribe', function(done){
            var msg = hClient1.buildMessage(chanActive, undefined, undefined, {timeout: 30000});

            hClient2.onMessage = function(hMessage){
                hMessage.publisher.should.not.be.eql(hClient1.publisher);
            };

            var hFilter = {};
            hClient1.setFilter(hFilter, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);

                hClient1.send(msg, function(hMessage){
                    hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);
                    setTimeout(function(){
                        done();
                    }, 800); //Set a timeout to test if the message is received
                });
            })
        })
    })

})

describe('#publish()', function() {
    beforeEach(function() {
        hClient2 = new HClient();
    });

    it('should return NOT_CONNECTED if user tries to publish message while not connected', function(done){
        var msg = hClient2.buildMessage('invalid channel actor', undefined, undefined, {timeout: 30000});
        hClient2.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.NOT_CONNECTED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})