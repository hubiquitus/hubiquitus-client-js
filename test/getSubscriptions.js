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

var user = conf.logins[0];
var channel = conf.GetValidChJID();

var subscriptionsSize = 0;

describe('#getSubscriptions()', function() {

    var subscriptions;

    before(conf.connect)

    after(conf.disconnect)

    //Get subscriptions
    before(function(done){
        hClient.getSubscriptions(function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            subscriptions = hMessage.payload.result;
            done();
        });
    })

    //Remove subscriptions
    before(function(done){
        var counter = 0;
        var onResult = function(hMessage){
            if(++counter == subscriptions.length){
                done();
                return;
            }
            hClient.unsubscribe(subscriptions[counter], onResult);
        };

        if(subscriptions.length > 0)
            hClient.unsubscribe(subscriptions[counter], onResult);
        else
            done();
    })

    it('should return status OK with empty array if no subscriptions', function(done){
        hClient.getSubscriptions(function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(0);
            done();
        })
    })

})

describe('#getSubscriptions()', function() {

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(channel, user.login, [user.login], true, done);
    })

    before(function(done){
        hClient.subscribe(channel, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        })
    })

    it('should return a subscription list of length old+1 after subscription to a new channel', function(done){
        subscriptionsSize++;
        hClient.getSubscriptions(function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(subscriptionsSize);
            done();
        })
    })

})

describe('#getSubscriptions()', function() {

    before(conf.connect)

    after(conf.disconnect)

    //Make channel inactive
    before(function(done){
        conf.createChannel(channel, user.login, [user.login], false, done);
    })

    it('should return a subscription list of length old-1 after a channel subscribed becomes inactive', function(done){
        subscriptionsSize--;
        hClient.getSubscriptions(function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hMessage.payload.result.should.be.an.instanceof(Array).and.have.lengthOf(subscriptionsSize);
            done();
        })
    })

})

describe('#getSubscriptions()', function() {

    it('should return a hResult with status NOT_CONNECTED if user tries to getSubscriptions while disconnected', function(done){
        hClient.getSubscriptions(function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})

