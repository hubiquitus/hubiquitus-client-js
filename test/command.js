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

var user = conf.logins[0];

describe('#command()', function() {

    before(conf.connect)

    after(conf.disconnect)

    it('should send a command to another user and receive it', function(done){
        hClient.onCommand = function(command){
            command.cmd.should.be.eql('hEcho');
            done();
        };

        hClient.command({
            entity : hClient.publisher,
            cmd : 'hEcho'
        }, function(hResult){})

    })
})