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

var hClient1 = new (require('../hubiquitus.js').HubiquitusClient)();
var hClient2 = new (require('../hubiquitus.js').HubiquitusClient)();


describe('#publish()', function() {

    var user1 = conf.logins[0];
    var user2 = conf.logins[1];

    var chanActive = conf.GetValidChJID();
    var chanInactive = conf.GetValidChJID();
    var chanNotInPart = conf.GetValidChJID();

    var msgCreatedOffline;

    before(function(){
        msgCreatedOffline = hClient1.buildMessage(chanActive, null, null, {timeout: 30000});
    })

    before(function(done){
        conf.connect(done, user1, conf.hOptions, hClient1);
    })

    before(function(done){
        conf.connect(done, user2, conf.hOptions, hClient2);
    })

    before(function(done){
        conf.createChannel(chanActive, user1.login, [user1.login, user2.login], true, done, hClient1);
    })

    before(function(done){
        conf.createChannel(chanInactive, user1.login, [user1.login, user2.login], false, done, hClient1);
    })

    before(function(done){
        conf.createChannel(chanNotInPart, user1.login, [user1.login], true, done, hClient1);
    })

    before(function(done){
        hClient2.subscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
            done();
        })
    })

    after(function(done){
        conf.disconnect(done, hClient1);
    })

    after(function(done){
        conf.disconnect(done, hClient2);
    })

    afterEach(function(){
        hClient1.onMessage = function(hMessage){};
        hClient2.onMessage = function(hMessage){};
        hClient1.onStatus = function(hStatus){};
        hClient2.onStatus = function(hStatus){};
    })

    /*it('should return NOT_AUTHORIZED if user tries to publish and not in subscribers list', function(done){
        hClient2.send(hClient2.buildMessage(chanNotInPart, undefined, undefined, {timeout: 30000}), function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })*/

    it('should return NOT_AUTHORIZED if user tries to publish to an inactive channel', function(done){
        hClient2.send(hClient2.buildMessage(chanInactive, undefined, undefined, {timeout: 30000}), function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
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
        var msg = hClient2.buildMessage('#invalid channel actor@localhost', undefined, undefined, {timeout: 30000});
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

    it('should receive published message by another person', function(done){
        var msg = hClient1.buildMessage(chanActive, undefined, undefined, {timeout: 30000});

        hClient2.onMessage = function(hMessage){
            hMessage.publisher.should.be.eql(hClient1.publisher);
            done();
        };

        hClient1.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);
        });
    })

    it('should receive published message by ourselves if subscribed', function(done){
        var msg = hClient2.buildMessage(chanActive, undefined, undefined, {timeout: 30000});

        hClient2.onMessage = function(hMessage){
            hMessage.publisher.should.be.eql(hClient2.publisher);
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
            hMessage.publisher.should.be.eql(hClient2.publisher);
            if(++counter == 2)
                done();
        };

        hClient2.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
            if(++counter == 2)
                done();
        });
    })

    it('should receive published message that passes through a filter', function(done){
        var msg = hClient2.buildMessage(chanActive, undefined, undefined, {priority: 3, timeout: 30000});
        var hFilterTemplate = {
            name: 'a filter',
            actor: chanActive,
            template: {priority: 3}
        };

        hClient2.setFilter(hFilterTemplate, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);

            var counter = 0;
            hClient2.onMessage = function(hMessage){
                hMessage.publisher.should.be.eql(hClient2.publisher);
                if(++counter == 2)
                    done();
            };

            hClient2.send(msg, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
                if(++counter == 2)
                    done();
            });
        })
    })

    it('should not receive published message that does not pass through a filter', function(done){
        var msg = hClient2.buildMessage(chanActive, undefined, undefined, {priority: 4, timeout: 30000});

        hClient2.onMessage = function(hMessage){
            hMessage.publisher.should.not.be.eql(hClient2.publisher);
        };

        hClient2.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
        });

        setTimeout(done, 800);
    })

    it('should receive published message that was filtered before but unset', function(done){
        var msg = hClient2.buildMessage(chanActive, undefined, undefined, {priority: 4, timeout: 30000});
        var counter = 0;

        hClient2.unsetFilter('a filter', chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);

            hClient2.onMessage = function(hMessage){
                hMessage.publisher.should.be.eql(hClient2.publisher);
                if(++counter == 2)
                    done();
            };

            hClient2.send(msg, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
                if(++counter == 2)
                    done();
            });
        })

    })

    it('should publish message to another user and the other should receive it', function(done){
        var msg = hClient1.buildMessage(hClient2.publisher, undefined, undefined, {priority: 4, timeout: 30000});
        var counter = 0;

        hClient2.onMessage = function(hMessage){
            hMessage.publisher.should.be.eql(hClient1.publisher);
            hMessage.actor.should.be.eql(hClient2.publisher);

            //send a response
            hClient2.send(hClient2.buildResult(hClient1.publisher, hMessage.msgid, hClient2.hResultStatus.OK));

            if(++counter == 2)
                done();
        };

        hClient1.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);
            if(++counter == 2)
                done();
        });

    })

    describe('#publish()', function(){
        before(function(done){
            hClient2.unsubscribe(chanActive, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient2.hResultStatus.OK);
                done();
            })
        })

        it('should not receive published message after unsubscribe', function(done){
            var msg = hClient1.buildMessage(chanActive, undefined, undefined, {timeout: 30000});
            hClient2.onMessage = function(hMessage){
                hMessage.publisher.should.not.be.eql(hClient1.publisher);
            };

            hClient1.send(msg, function(hMessage){
                hMessage.payload.status.should.be.eql(hClient1.hResultStatus.OK);
                setTimeout(done, 800); //Set a timeout to test if the message is received
            });

        })
    })

})

describe('#publish()', function() {
    it('should return NOT_CONNECTED if user tries to publish message while not connected', function(done){
        var msg = hClient2.buildMessage('invalid channel actor', undefined, undefined, {timeout: 30000});
        hClient2.send(msg, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient2.hResultStatus.NOT_CONNECTED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})