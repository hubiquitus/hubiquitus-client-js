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

