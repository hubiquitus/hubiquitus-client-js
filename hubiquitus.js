define(['lodash', 'sockjs', 'util', 'events', 'logger'], function (_, SockJS, util, EventEmitter, logger) {
  'use strict';

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
        logger.warn('hubiquitus is busy, cant connect ' + endpoint);
        return this;
      }

      var _this = this;

      cb && this.once('connect', cb);
      this._sock = new SockJS(endpoint);

      this._sock.onopen = function () {
        logger.info('hubiquitus connected');
        var message = encode({type: 'login', authData: authData});
        message && _this._sock.send(message);
      };

      this._sock.onclose = function () {
        logger.info('hubiquitus disconnected');
        _this._sock = null;
        _this.emit('disconnect');
      };

      this._sock.onmessage = function (e) {
        logger.trace('hubiquitus received message', e.data);
        var message = decode(e.data);
        if (!message) return;
        switch (message.type) {
          case 'message':
            _this._onMessage(message);
            break;
          case 'response':
            _this._events.emit('response|' + message.id, message);
            break;
          case 'login':
            logger.info('Hubiquitus logged in; identifier is', message.payload.content.id);
            _this.id = message.payload.content.id;
            _this.emit('connect');
            break;
          default:
            logger.warn('Hubiquitus received unknown message type', message);
        }
      };

      return this;
    };

    Hubiquitus.prototype.disconnect = function () {
      if (!this._sock) {
        logger.warn('hubiquitus is already idle');
        return this;
      }

      this._sock && this._sock.close();
      return this;
    };

    Hubiquitus.prototype.send = function (to, content, timeout, cb) {
      var _this = this;

      if (_.isFunction(timeout)) { cb = timeout; timeout = defaultSendTimeout; }
      timeout = timeout ||  maxSendTimeout;
      var message = {to: to, payload: {content: content}, id: util.uuid(), date: (new Date()).getTime(), type: 'message'};

      _this._events.once('response|' + message.id, function (response) {
        _this._onResponse(response, cb);
      });

      setTimeout(function () {
        _this._events.emit('response|' + message.id, {payload: {err: 'TIMEOUT'}});
      }, timeout);

      logger.trace('hubiquitus sending message', message);
      message = encode(message);
      message && this._sock.send(message);

      return this;
    };

    Hubiquitus.prototype._onMessage = function (message) {
      logger.trace('Hubiquitus processing message', message);
      this.emit('message', message.from, message.payload.content, function (err, content) {
        var response = {to: message.from, id: message.id, payload: {err: err, content: content}, type: 'response'};
        response = encode(response);
        response && this._sock.send(response);
      });
    };

    Hubiquitus.prototype._onResponse = function (response, cb) {
      logger.trace('Hubiquitus processing response', response);
      cb && cb(response.payload.err, response.payload.content);
    };

    function encode(data) {
      var encodedData = null;
      try {
        encodedData = JSON.stringify(data);
      } catch (err) {
        logger.warn('hubiquitus failed encoding data', data);
      }
      return encodedData;
    }

    function decode(data) {
      var decodedData = null;
      try {
        decodedData = JSON.parse(data);
      } catch (err) {
        logger.warn('hubiquitus failed decoding data', data);
      }
      return decodedData;
    }

    return Hubiquitus;
  })();

  exports.logger = logger;
  return exports;
});
