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
var HubiquitusClient = require('../hubiquitus.js').HubiquitusClient;
var conf = require('./testConfig.js');

describe('Two Users Test', function(){

    var user1 = conf.logins[0];
    var user2 = conf.logins[1];
    var hNode = conf.hNode;

    var hClient1 = new HubiquitusClient();
    var hClient2 = new HubiquitusClient();

    //Callback to be used for each test. In each one, set before making a call
    //hCallback(1|2) = function(msg){<testCode>}
    var hCallback1;
    var hCallback2;

    var cb1 = function(msg){ hCallback1(msg) };
    var cb2 = function(msg){ hCallback2(msg) };

    var hOptions = JSON.parse(JSON.stringify(conf.hOptions));
    hOptions.stress = true;


    var chOnlyOne = 'chan' + Math.floor(Math.random()*1000);
    var chBoth = 'chan' + Math.floor(Math.random()*1000);

    before(function(done){
        //Connect first user
        hCallback1 = function(msg){
            if (msg.type == 'hStatus' && msg.data.status == hClient1.status.CONNECTED)
                done();
        };

        hClient1.connect(user1.login, user1.password, cb1, conf.hOptions);

    })

    before(function(done){
        //Connect second user
        hCallback2 = function(msg){
            if (msg.type == 'hStatus' && msg.data.status == hClient2.status.CONNECTED)
                done();
        };

        hClient2.connect(user2.login, user2.password, cb2, conf.hOptions);

    })

    after(function(done){
        hCallback1 = function(msg){
            if (msg.type == 'hStatus' && msg.data.status == hClient1.status.DISCONNECTED)
                done();
        };

        hClient1.disconnect();
    })

    after(function(done){
        hCallback2 = function(msg){
            if (msg.type == 'hStatus' && msg.data.status == hClient2.status.DISCONNECTED)
                done();
        };

        hClient2.disconnect();
    })

    before(function(done){
        //Create Channel with only one user as participant
        hCallback1 = function(msg){
            if(msg.type == 'hResult')
                done();
        };

        hClient1.command({
            entity: hNode,
            cmd: "hcreateupdatechannel",
            params:{
                chid: chOnlyOne,
                host: "test",
                owner: hClient1.publisher,
                participants: [hClient1.publisher],
                active: true
            }
        });

    })

    before(function(done){
        //Create Channel with both users as participants
        hCallback1 = function(msg){
            if(msg.type == 'hResult')
                done();
        };

        hClient1.command({
            entity: hNode,
            cmd: "hcreateupdatechannel",
            params:{
                chid: chBoth,
                host: "test",
                owner: hClient1.publisher,
                participants: [hClient1.publisher, hClient2.publisher],
                active: true
            }
        });

    })

    describe('#permissions', function(){

        it('should not allow subscription if not in participant list', function(done){
            hCallback2 = function(msg){
                if(msg.type == 'hResult'){
                    var hResult = msg.data;

                    hResult.status.should.be.equal(hClient2.hResultStatus.NOT_AUTHORIZED);
                    done();
                }
            }

            hClient2.subscribe(chOnlyOne);
        })

        it('should allow subscription if in participant list', function(done){
            hCallback2 = function(msg){
                if(msg.type == 'hResult'){
                    var hResult = msg.data;

                    hResult.status.should.be.equal(hClient2.hResultStatus.OK);
                    done();
                }
            }

            hClient2.subscribe(chBoth);
        })

        it('should allow to publish if in participant list but not subscribed', function(done){
            hCallback1 = function(msg){
                if(msg.type == 'hResult'){
                    var hResult = msg.data;

                    hResult.status.should.be.equal(hClient1.hResultStatus.OK);
                    done();
                }
            }

            hClient1.subscribe(chOnlyOne);
        })

    })

    describe('#message reception', function(){

        it('subscribed user should receive message from other user', function(done){

            hCallback2 = function(msg){
                if(msg.type == 'hMessage'){
                    var message = msg.data;
                    message.chid.should.be.equal(chBoth);
                    message.payload.should.be.eql(hMessage.payload);
                    done();
                }
            };
            hCallback1 = function(msg){};

            var hMessage = hClient1.buildAlert(chBoth, 'Alert!');
            hClient1.publish(hMessage);

            hClient1.subscribe(chOnlyOne);

        })

        it('subscribed user should receive message and publisher (allowed, but not subscribed) should not', function(done){

            hCallback2 = function(msg){
                if(msg.type == 'hMessage'){
                    var message = msg.data;
                    message.chid.should.be.equal(chBoth);
                    message.payload.should.be.eql(hMessage.payload);
                    done();
                }
            };
            hCallback1 = function(msg){
                if(msg.type == 'hMessage'){
                    msg.data.payload.should.not.be.eql(hMessage.payload);
                }
            };

            var hMessage = hClient1.buildAlert(chBoth, 'Alert!');
            hClient1.publish(hMessage);

            hClient1.subscribe(chOnlyOne);

        })

    })

})