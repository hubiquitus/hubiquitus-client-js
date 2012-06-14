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
