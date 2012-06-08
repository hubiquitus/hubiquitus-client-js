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

describe('Normal Functional Tests', function() {

    var user = conf.logins[0];

    //Callback to be used for each test. In each one, set before making a call
    //hCallback = function(msg){<testCode>}
    var hCallback;
    var cb = function(msg){ hCallback(msg) };

    describe('#connect()', function(){

        it('should receive hStatus connected', function(done){
            hCallback = function(msg){
                if (msg.type == 'hStatus' && msg.data.status == hClient.status.CONNECTED)
                    done();
            };

            hClient.connect(user.login, user.password, cb, conf.hOptions);
        })

        after(function(done){
            hCallback = function(msg){
                if (msg.type == 'hStatus' && msg.data.status == hClient.status.DISCONNECTED)
                    done();
            };

            hClient.disconnect();
        });

    })

    describe('#connect when connecting/connected', function(){

        it('should receive hStatus with error but connect anyway and receive hStatus connected', function(done){
            var counter = 0;
            hCallback = function(msg){
                if (msg.type == 'hStatus' && msg.data.status == hClient.status.CONNECTED)
                    counter++;
                else if (msg.type == 'hStatus' && msg.data.status == hClient.status.CONNECTING &&
                    msg.data.errorCode == hClient.errors.CONN_PROGRESS)
                    counter++;
                if (counter == 2)
                    done();
            };

            hClient.connect(user.login, user.password, cb, conf.hOptions);
            hClient.connect(user.login, user.password, cb, conf.hOptions);
        })

        it('should receive hStatus already connected and do not disconnect', function(done){
            hCallback = function(msg){
                if (msg.type == 'hStatus' && msg.data.status == hClient.status.CONNECTED &&
                    msg.data.errorCode == hClient.errors.ALREADY_CONNECTED)
                    done();
            };
            hClient.connect(user.login, user.password, hCallback, conf.hOptions);
        })

        after(function(done){
            hCallback = function(msg){
                if (msg.type == 'hStatus' && msg.data.status == hClient.status.DISCONNECTED)
                    done();
            };

            hClient.disconnect();
        });

    })

    describe('#wrong logins', function(){

        it('should receive hStatus with wrong password error', function(done){
            hCallback = function(msg){
                if (msg.type == 'hStatus' && msg.data.status == hClient.status.DISCONNECTED &&
                    msg.data.errorCode == hClient.errors.AUTH_FAILED)
                    done();
            };
            hClient.connect(user.login, 'another password', hCallback, conf.hOptions);
        })

        it('should receive hStatus with wrong jid format', function(done){
            hCallback = function(msg){
                if (msg.type == 'hStatus' && msg.data.status == hClient.status.DISCONNECTED &&
                    msg.data.errorCode == hClient.errors.JID_MALFORMAT)
                    done();
            };
            hClient.connect('this is not good', user.password, hCallback, conf.hOptions);
        })

    })

})
