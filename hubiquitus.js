define(['lodash', 'sockjs', 'util', 'events', 'logger'], function (_, SockJS, util, EventEmitter, loggerManager) {
  'use strict';

  var logger = loggerManager.getLogger('hubiquitus');

  var defaultSendTimeout = 30000;
  var maxSendTimeout = 5 * 3600000;

  var exports = window.Hubiquitus = (function() {

    function Hubiquitus() {
      EventEmitter.call(this);
      this._sock = null;
      this._events = new EventEmitter();
      this.id = null;
    }

    util.inherits(Hubiquitus, EventEmitter);

    Hubiquitus.prototype.connect = function (endpoint, authData, cb) {
      if (this._sock) {
        logger.warn('is busy, cant connect ' + endpoint);
        return this;
      }

      var _this = this;

      cb && this.once('connect', cb);
      this._sock = new SockJS(endpoint);

      this._sock.onopen = function () {
        logger.info('connected');
        var msg = encode({type: 'login', authData: authData});
        msg && _this._sock.send(msg);
      };

      this._sock.onclose = function () {
        logger.info('disconnected');
        _this._sock = null;
        _this.emit('disconnect');
      };

      this._sock.onmessage = function (e) {
        logger.trace('received message', e.data);
        var msg = decode(e.data);
        if (!msg) return;
        switch (msg.type) {
          case 'req':
            _this._onReq(msg);
            break;
          case 'res':
            _this._events.emit('res|' + msg.id, msg);
            break;
          case 'login':
            logger.info('logged in; identifier is', msg.content.id);
            _this.id = msg.content.id;
            _this.emit('connect');
            break;
          default:
            logger.warn('received unknown message type', msg);
        }
      };

      return this;
    };

    Hubiquitus.prototype.disconnect = function () {
      if (!this._sock) {
        logger.warn('is already idle');
        return this;
      }

      this._sock && this._sock.close();
      return this;
    };

    Hubiquitus.prototype.send = function (to, content, timeout, cb) {
      var _this = this;

      if (_.isFunction(timeout)) { cb = timeout; timeout = defaultSendTimeout; }
      timeout = timeout ||  maxSendTimeout;
      var req = {to: to, content: content, id: util.uuid(), date: (new Date()).getTime(), type: 'req'};

      _this._events.once('res|' + req.id, function (res) {
        _this._onRes(res, cb);
      });

      setTimeout(function () {
        _this._events.emit('res|' + req.id, {err: 'TIMEOUT'});
      }, timeout);

      logger.trace('sending request', req);
      req = encode(req);
      req && this._sock.send(req);

      return this;
    };

    Hubiquitus.prototype._onReq = function (req) {
      logger.trace('processing message', req);
      this.emit('message', req.from, req.content, function (err, content) {
        var res = {to: req.from, id: req.id, err: err, content: content, type: 'res'};
        res = encode(res);
        res && this._sock.send(res);
      });
    };

    Hubiquitus.prototype._onRes = function (res, cb) {
      logger.trace('processing response', res);
      cb && cb(res.err, res);
    };

    function encode(data) {
      var encodedData = null;
      try {
        encodedData = JSON.stringify(data);
      } catch (err) {
        logger.warn('failed encoding data', data, err);
      }
      return encodedData;
    }

    function decode(data) {
      var decodedData = null;
      try {
        decodedData = JSON.parse(data);
      } catch (err) {
        logger.warn('failed decoding data', data, err);
      }
      return decodedData;
    }

    return Hubiquitus;
  })();

  exports.logger = loggerManager;
  return exports;
});
