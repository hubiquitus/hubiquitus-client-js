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

describe('Connection tests', function() {

    var user = conf.logins[0];

    describe('#connect()', function(){

        it('should receive hStatus connected', function(done){
            hClient.onStatus = function(hStatus){
                if(hStatus.status == hClient.statuses.CONNECTED){
                    hStatus.errorCode.should.be.equal(hClient.errors.NO_ERROR);
                    done();
                }
            };

            hClient.connect(user.login, user.password, conf.hOptions);
        })

        after(conf.disconnect);

    })

    describe('#connect() failures', function(){
        it('should receive hStatus with AUTH_FAILED if wrong password', function(done){
            hClient.onStatus = function(hStatus){
                if(hStatus.status ==  hClient.statuses.DISCONNECTED){
                    hStatus.errorCode.should.be.eql(hClient.errors.AUTH_FAILED);
                    done();
                }
            };
            hClient.connect(user.login, 'another password', conf.hOptions);
        })

        it('should receive hStatus with JID_MALFORMAT if wrong format', function(done){
            hClient.onStatus = function(hStatus){
                if(hStatus.status ==  hClient.statuses.DISCONNECTED){
                    hStatus.errorCode.should.be.eql(hClient.errors.JID_MALFORMAT);
                    done();
                }
            };
            hClient.connect('another login', user.password, conf.hOptions);
        })
    })

    describe('#connect when connecting/connected', function(){

        it('should receive hStatus with error but connect anyway and receive hStatus connected', function(done){
            var counter = 0;
            hClient.onStatus = function(hStatus){
                if(hStatus.status == hClient.statuses.CONNECTED){
                    hStatus.errorCode.should.be.eql(hClient.errors.NO_ERROR);
                    counter++;
                }else if (hStatus.status == hClient.statuses.CONNECTING &&
                    hStatus.errorCode == hClient.errors.CONN_PROGRESS){
                    counter++;
                }
                if(counter == 2)
                    done();
            };

            hClient.connect(user.login, user.password, conf.hOptions);
            hClient.connect(user.login, user.password, conf.hOptions);
        })

        it('should receive hStatus already connected and do not disconnect', function(done){
            hClient.onStatus = function(hStatus){
                if(hStatus.status == hClient.statuses.CONNECTED){
                    hStatus.errorCode.should.be.eql(hClient.errors.ALREADY_CONNECTED);
                    done();
                }
            };
            hClient.connect(user.login, user.password, conf.hOptions);
        })

        after(conf.disconnect);

    })

    describe('#disconnect()', function(){

        before(conf.connect)

        it('should receive hStatus disconnected without error if doing it normally', function(done){
            hClient.onStatus = function(hStatus){
                if(hStatus.status == hClient.statuses.DISCONNECTED){
                    hStatus.errorCode.should.be.equal(hClient.errors.NO_ERROR);
                    done();
                }
            };

            hClient.disconnect();
        });

        it('should receive hStatus disconnected with error if already disconnected', function(done){
            hClient.onStatus = function(hStatus){
                if(hStatus.status == hClient.statuses.DISCONNECTED){
                    hStatus.errorCode.should.be.equal(hClient.errors.NOT_CONNECTED);
                    done();
                }
            };

            hClient.disconnect();
        });

    })

})
