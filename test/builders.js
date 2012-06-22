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
/*
 Because the throws are in another file, the condition should.throw() does not work.
 Using instead: try-catch + should in the caught error
 */
describe('#buildMessage()', function() {

    var chid = 'chan';

    it('should throw an error if chid not provided', function(done) {
        try {
            hClient.buildMessage();
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should create a message if chid provided', function(done) {
        try {
            hClient.buildMessage(chid);
            done();
        } catch (error) {
        }
    });



})

describe('#buildMeasure()', function() {

    var chid = 'chan';
    var value = 10;
    var unit = 'meter';

    it('should throw an error if nothing provided', function(done) {
        try {
            hClient.buildMeasure();
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if value not provided but chid provided', function(done) {
        try {
            hClient.buildMeasure(chid);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if unit not provided but chid and value provided', function(done) {
        try {
            hClient.buildMeasure(chid,value);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if chid not provided but value and unit provided', function(done) {
        try {
            hClient.buildMeasure(undefined,value,unit);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if unit not provided but chid and unit provided', function(done) {
        try {
            hClient.buildMeasure(chid,undefined,unit);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if unitis only provided', function(done) {
        try {
            hClient.buildMeasure(undefined,undefined,unit);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should create a measure if all provided', function(done) {
        try {
            hClient.buildMessage(chid,value,unit);
            done();
        } catch (error) {
        }
    });

})

describe('#buildAck()', function() {

    var chid = 'chan';
    var ackid = 'ackid';
    var ack = 'recv';
    var options = {convid : "convid"};

    it('should throw an error if nothing provided', function(done) {
        try {
            hClient.buildAck();
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if ackid not provided but chid provided', function(done) {
        try {
            hClient.buildAck(chid);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if ack not provided but chid, ackid provided', function(done) {
        try {
            hClient.buildAck(chid,ackid);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if options not provided but chid, ackid and ack provided', function(done) {
        try {
            hClient.buildAck(chid,ackid,ack);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should create an ack if all provided', function(done) {
        try {
            hClient.buildAck(chid,ackid,ack,options);
            done();
        } catch (error) {
        }
    });

})

describe('#buildConvState()', function() {

    var chid = 'chan';
    var convid = 'convid';
    var status = 'status';
    var options = {convid : "convidOpt"};

    it('should throw an error if nothing provided', function(done) {
        try {
            hClient.buildConvState();
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if convid not provided but chid provided', function(done) {
        try {
            hClient.buildConvState(chid);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if status not provided but chid, convid provided', function(done) {
        try {
            hClient.buildConvState(chid,convid);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should create a ConvState if only options not provided', function(done) {
        try {
            hClient.buildConvState(chid,convid,status);
            done();
        } catch (error) {
        }
    });

    it('should create a ConvState if all provided', function(done) {
        try {
            hClient.buildConvState(chid,convid,status,options);
            done();
        } catch (error) {
        }
    });

})


describe('#buildAlert()', function() {

    var chid = 'chan';
    var alert = 'alert';

    it('should throw an error if nothing provided', function(done) {
        try {
            hClient.buildAlert();
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if alert not provided but chid provided', function(done) {
        try {
            hClient.buildAlert(chid);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should create an ack if all provided', function(done) {
        try {
            hClient.buildAlert(chid,alert);
            done();
        } catch (error) {
        }
    });

})

