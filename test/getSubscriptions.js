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

