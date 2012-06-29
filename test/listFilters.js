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

describe('#listFilters()', function() {
    var activeChannel = 'chan' + Math.floor(Math.random()*10000),
        name = 'a filter name';

    before(conf.connect)

    after(conf.disconnect)

    before(function(done){
        conf.createChannel(activeChannel, user.login, [user.login], true, done);
    })

    before(function(done){
        hClient.setFilter({
            name: name,
            chid: activeChannel,
            template: {priority: 2}
        }, function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        })

    })

    it('should return OK with the filter in the array', function(done){
        hClient.listFilters(function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.OK);
            for(var i = 0; i < hResult.result.length; i++)
                if(hResult.result[i].name == name)
                    done();
        })
    })
})

describe('#listFilters()', function() {

    it('should return a hResult with status NOT_CONNECTED if user tries to recover filters while disconnected', function(done){
        hClient.listFilters(function(hResult){
            hResult.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})

