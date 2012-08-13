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

    var actor = 'chan';

    it('should throw an error if actor not provided', function(done) {
        try {
            hClient.buildMessage();
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should create a message if actor provided', function(done) {
        try {
            hClient.buildMessage(actor);
            done();
        } catch (error) {
        }
    });



})

describe('#buildMeasure()', function() {

    var actor = 'chan';
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

    it('should throw an error if value not provided but actor provided', function(done) {
        try {
            hClient.buildMeasure(actor);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if unit not provided but actor and value provided', function(done) {
        try {
            hClient.buildMeasure(actor,value);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if actor not provided but value and unit provided', function(done) {
        try {
            hClient.buildMeasure(undefined,value,unit);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if unit not provided but actor and unit provided', function(done) {
        try {
            hClient.buildMeasure(actor,undefined,unit);
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
            hClient.buildMessage(actor,value,unit);
            done();
        } catch (error) {
        }
    });

})

describe('#buildAck()', function() {

    var actor = 'chan';
    var ack = 'recv';
    var ref = 'aRef';
    var options = {convid : "convid"};

    it('should throw an error if nothing provided', function(done) {
        try {
            hClient.buildAck();
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if ref not provided but actor provided', function(done) {
        try {
            hClient.buildAck(actor);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if ack not provided but actor and ref provided', function(done) {
        try {
            hClient.buildAck(actor,ack);
        } catch (error) {
            done();
        }
    });

    it('should not throw an error if options not provided but actor, ref, ack provided', function(done) {
        try {
            hClient.buildAck(actor,ref,ack);
            done();
        } catch (error) {
            console.log("error : ", error);
        }
    });

    it('should create an ack if all provided', function(done) {
        try {
            hClient.buildAck(actor,ref,ack,options);
            done();
        } catch (error) {
        }
    });

})

describe('#buildConvState()', function() {

    var actor = 'chan';
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

    it('should throw an error if convid not provided but actor provided', function(done) {
        try {
            hClient.buildConvState(actor);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if status not provided but actor, convid provided', function(done) {
        try {
            hClient.buildConvState(actor,convid);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should create a ConvState if only options not provided', function(done) {
        try {
            hClient.buildConvState(actor,convid,status);
            done();
        } catch (error) {
        }
    });

    it('should create a ConvState if all provided', function(done) {
        try {
            hClient.buildConvState(actor,convid,status,options);
            done();
        } catch (error) {
        }
    });

})


describe('#buildAlert()', function() {

    var actor = 'chan';
    var alert = 'alert';

    it('should throw an error if nothing provided', function(done) {
        try {
            hClient.buildAlert();
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should throw an error if alert not provided but actor provided', function(done) {
        try {
            hClient.buildAlert(actor);
        } catch (error) {
            should.exist(error.message);
            done();
        }
    });

    it('should create an ack if all provided', function(done) {
        try {
            hClient.buildAlert(actor,alert);
            done();
        } catch (error) {
        }
    });

})

