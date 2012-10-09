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
var hFilter;

describe('#setFilter()', function() {
    var activeChannel = conf.GetValidChJID(),
        inactiveChannel = conf.GetValidChJID(),
        notInPartChannel = conf.GetValidChJID();

    before(conf.connect);

    after(conf.disconnect);

    before(function(done){
        conf.createChannel(activeChannel, user.login, [user.login], true, done);
    })

    before(function(done){
        conf.createChannel(inactiveChannel, user.login, [user.login], false, done);
    })

    before(function(done){
        conf.createChannel(notInPartChannel, user.login, [], false, done);
    })

    beforeEach(function(){
        hFilter = {};
    })


    it('should return hResult OK if params filter is empty', function(done){
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.OK);
            done();
        });
    })

    it('should return hResult INVALID_ATTR if params filter is not an object', function(done){
        hFilter.filter = 'a string';
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter does not start with a correct operand', function(done){
        hFilter.filter = {bad:{attribut:true}};
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand eq/ne/lt/lte/gt/gte/in/nin is not an object', function(done){
        hFilter.filter = {
            eq:'string',
            ne:'string',
            lt:'string',
            lte:'string',
            gt:'string',
            gte:'string',
            in:'string',
            nin:'string'
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand and/or/nor is not an array', function(done){
        hFilter.filter = {
            and:{attribut:false},
            or:{attribut:false},
            nor:{attribut:false}
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand and/or/nor is an array of 1 element', function(done){
        hFilter.filter = {
            and:[{attribut:false}],
            or:[{attribut:false}],
            nor:[{attribut:false}]
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand not is an valid object', function(done){
        hFilter.filter = {
            not:[{attribut:false}]
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand not contain valid operand', function(done){
        hFilter.filter = {
            not:{bad:{attribut:false}}
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand relevant is not a boolean', function(done){
        hFilter.filter = {
            relevant:'string'
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand geo have not attribut radius', function(done){
        hFilter.filter = {
            geo:{
                lat:12,
                lng:24
            }
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand geo have not attribut lat', function(done){
        hFilter.filter = {
            geo:{
                lng:24,
                radius:10000
            }
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if filter with operand geo have not attribut lng', function(done){
        hFilter.filter = {
            geo:{
                lat:12,
                radius:10000
            }
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if attribut lat of filter geo is not a number', function(done){
        hFilter.filter = {
            geo:{
                lat:'string',
                lng:24,
                radius:10000
            }
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if attribut lng of filter geo is not a number', function(done){
        hFilter.filter = {
            geo:{
                lat:12,
                lng:'string',
                radius:10000
            }
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })

    it('should return hResult INVALID_ATTR if attribut lat of filter geo is not a number', function(done){
        hFilter.filter = {
            geo:{
                lat:12,
                lng:24,
                radius:'string'
            }
        };
        hClient.setFilter(hFilter, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.INVALID_ATTR);
            hMessage.payload.result.should.be.a('string');
            done();
        });
    })
})

describe('#setFilter()', function() {

    it('should return a hResult with status NOT_CONNECTED if user tries to set filter while disconnected', function(done){
        hClient.setFilter({}, function(hMessage){
            hMessage.payload.status.should.be.eql(hClient.hResultStatus.NOT_CONNECTED);
            done();
        })
    })

})

