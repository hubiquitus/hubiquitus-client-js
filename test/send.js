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
var HClient = require('../hubiquitus.js').HClient;
var conf = require('./testConfig.js');

var user = conf.logins[0];

describe('#send()', function() {

    var hClient1 = new HClient();
    var hClient2 = new HClient();
    var user1 = conf.logins[0];
    var user2 = conf.logins[1];

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

    it('should send a message to another user and receive it', function(done){
        hClient2.onMessage = function(hMessage) {
            hMessage.payload.cmd.should.be.eql("hEcho");
            done();
        }

        hClient1.send(hClient1.buildCommand(hClient2.fullurn, "hEcho", {}));
    })
})