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

describe('#unsubscribe()', function() {

    var user = conf.logins[0];
    var chanActive = conf.GetValidChJID();
    var chanInactive = conf.GetValidChJID();
    var chanInactiveNotSubscribed = conf.GetValidChJID();

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(chanActive, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(chanInactive, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(chanInactiveNotSubscribed, user.login, [conf.logins[1].login], false, done);
    })

    before(function(done){
        hClient.subscribe(chanActive, function(hMessage){
            done();
        });
    })

    before(function(done){
        hClient.subscribe(chanInactive, function(hMessage){
            done();
        });
    })

    before(function(done){
        conf.createChannel(chanInactive, user.login, [user.login], false, done);
    });

    it('should return hResult status NOT_AVAILABLE and result be a message if channel does not exist', function(done) {
        hClient.unsubscribe("#This chan does not exist@localhost", function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if channel inactive and user was subscribed', function(done) {
        hClient.unsubscribe(chanInactive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if channel inactive and user not subscribed', function(done) {
        hClient.unsubscribe(chanInactiveNotSubscribed, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status MISSING_ATTR and result be a message if actor not provided', function(done) {
        hClient.unsubscribe(undefined, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.MISSING_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status OK if subscribed and in subscribers list', function(done) {
        hClient.unsubscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hClient.getSubscriptions(function(hMessage) {
                hMessage.payload.result.should.not.include(chanActive);
            });
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if user not subscribed', function(done) {
        hClient.unsubscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})

describe('#unsubscribe()', function() {

    var user = conf.logins[0];
    var chanActive = conf.GetValidChJID();

    it('should return hResult status NOT_CONNECTED and result be a message if user not connected', function(done) {
        hClient.unsubscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})

describe('#unsubscribe()', function() {

    var user = conf.logins[0];
    var chanActive = conf.GetValidChJID();

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(chanActive, user.login, [user.login], true, done);
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if user not subscribed', function(done) {
        hClient.unsubscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})


