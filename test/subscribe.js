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

describe('#subscribe()', function() {

    var user = conf.logins[0];
    var chanActive = conf.GetValidChJID();
    var chanInactive = conf.GetValidChJID();
    var chanNotInPart = conf.GetValidChJID();

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(chanActive, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(chanInactive, user.login, [user.login], false, done);
    })

    before(function(done){
        conf.createChannel(chanNotInPart, user.login, [conf.logins[1].login], true, done);
    })

    it('should return hResult status NOT_AVAILABLE and result be a message if channel does not exist', function(done) {
        hClient.subscribe('#chan does not exist@localhost', function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AVAILABLE);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if channel is inactive', function(done) {
        hClient.subscribe(chanInactive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if user not in subscribers list', function(done) {
        hClient.subscribe(chanNotInPart, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult status OK if not subscribed and in subscribers list', function(done) {
        hClient.subscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            hClient.getSubscriptions(function(hMessage) {
                var normalizedChanActive = '#' + chanActive + '@' + hClient.domain;
                hMessage.payload.result.should.include(normalizedChanActive);
            });
            done();
        });
    })

    it('should return hResult status NOT_AUTHORIZED and result be a message if user not in subscribers list', function(done) {
        hClient.subscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_AUTHORIZED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})

describe('#subscribe()', function() {

    var user = conf.logins[0];
    var chanActive = 'chan' + Math.floor(Math.random()*10000);

    it('should return hResult status NOT_CONNECTED and result be a message if user not connected', function(done) {
        hClient.subscribe(chanActive, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

})