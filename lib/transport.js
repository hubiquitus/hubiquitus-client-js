define(['sockjs', 'lodash', 'util', 'events', 'logger'], function (SockJS, _, util, EventEmitter, loggerManager) {
  'use strict';

  var logger = loggerManager.getLogger('hubiquitus:transport');
  var connTimeout = 10000;
  var reconnDelay = 3000;
  var negoationTimeout = 2000;
  var heartbeatFreq = 15000;

  var exports = (function () {

    /**
     * Transport layer
     * @param {object} [options]
     * @constructor
     */
    function Transport(options) {
      EventEmitter.call(this);
      this.endpoint = null;
      options = options || {};
      this._sock = null;
      this._started = false;
      this._locked = false;
      this._events = new EventEmitter();
      this._autoReconnect = options.autoReconnect || false;
      this._shouldReconnect = false;
      this._reconnecting = false;
      this._negotiating = false;
      this._whitelist = ['websocket', 'xdr-streaming', 'xhr-streaming', 'iframe-eventsource', 'iframe-htmlfile', 'xdr-polling', 'xhr-polling', 'iframe-xhr-polling', 'jsonp-polling'];
      this._heartbeatFreq = 15000;
      this._lastHeartbeat = -1;
    }

    util.inherits(Transport, EventEmitter);

    /**
     * Connect to endpoint
     * @param {string} [endpoint]
     * @param {function} [cb]
     */
    Transport.prototype.connect = function (endpoint, cb) {
      if (endpoint) this.endpoint = endpoint;
      logger.trace('connecting ' + this.endpoint + '...');
      if ((this._locked && !this._reconnecting && !this._negotiating) || this._started) {
        logger.warn((this._locked ? 'busy' : 'already started'), '; cant connect ' + endpoint);
        this.emit('error', {code: this._locked ? 'BUSY' : 'ALREADYCONN'});
        return;
      }

      cb && this.once('connect', cb);

      if (!this._reconnecting) {
        this._locked = true;
        if (this._autoReconnect) this._shouldReconnect = true;
      }

      this._sock = new SockJS(this.endpoint, null, {protocols_whitelist: this._whitelist});

      this._sock.onopen = this._onopen.bind(this);
      this._sock.onclose = this._onclose.bind(this);
      this._sock.onmessage = this._onmessage.bind(this);

      var _this = this;
      setTimeout(function () {
        if (!_this._started) _this.emit('error', {code: 'CONNTIMEOUT'})
      }, connTimeout);
    };

    /**
     * Disconnect from endpoint
     * @param {function} [cb]
     */
    Transport.prototype.disconnect = function (cb) {
      logger.trace('disconnecting...');
      if ((this._locked && !this._reconnecting && !this._negotiating) || !this._started) {
        logger.warn((this._locked ? 'busy' : 'already stopped'), '; cant disconnect');
        this.emit('error', {code: this._locked ? 'BUSY' : 'ALREADYDISCONN'});
        return;
      }

      cb && this.once('disconnect', cb);

      this._locked = true;
      this._shouldReconnect = false;
      this._sock && this._sock.close();
    };

    /**
     * Send a message to endpoint
     * @param {*} msg
     * @param {function} [cb]
     */
    Transport.prototype.send = function (msg, cb) {
      if (this._locked || !this._started) {
        logger.warn((this._locked ? 'busy' : 'not started'), '; cant send message', msg);
        cb && cb({code: this._locked ? 'BUSY' : 'NOTCONN'});
        return;
      }

      var encodedMsg = encode(msg);
      encodedMsg && this._sock.send(encodedMsg);
      cb && cb();
    };

    /**
     * Sock open listener
     * @private
     */
    Transport.prototype._onopen = function () {
      var _this = this;
      _this._started = true;
      _this._locked = false;
      this._negotiate(function (err) {
        if (err) {
          logger.warn("Protocol negotiation error");
          _this._sock && _this._sock.close();
          _this.emit('error', err);
          return;
        }

        //Start heartbeat timer
        _this._lastHeartbeat = Date.now();
        _this._checkConn();

        logger.info((_this._reconnecting ? 'reconnected' : 'connected') + ' using ' + _this._sock.protocol);
        _this.emit(_this._reconnecting ? 'reconnect' : 'connect');
        _this._reconnecting = false;
      });
    };

    Transport.prototype._checkConn = function () {
      var _this = this;
      if (_this._started) {
        if (Date.now() - (_this._lastHeartbeat + _this._heartbeatFreq + (0.5 * _this._heartbeatFreq))  > 0) {
          logger.debug("Last heartbeat too old : ", _this._lastHeartbeat, " freq : ", _this._heartbeatFreq);
          _this._sock && _this._sock.close();
          _this.emit('error', {code:"HBTIMEOUT"});
        }
        setTimeout(function () {
          _this._checkConn();
        }, _this._heartbeatFreq);
      }
    }

    /**
     * Sock close listener
     * @private
     */
    Transport.prototype._onclose = function () {
      this._sock = null;
      this._started = false;
      this._lastHeartbeat = -1;

      if (!this._shouldReconnect) {
        this._locked = false;
        logger.info('disconnected');
        this.emit('disconnect');
      } else if (!this._reconnecting) {
        this.emit('disconnect'); // first time we try to reconnect
        this._reconnecting = true;
        var _this = this;
        (function reconnect() {
          if (_this._started || !_this._shouldReconnect) return;
          logger.info('reconnecting...');
          _this.connect();
          setTimeout(reconnect, reconnDelay);
        })();
      }
    };

    /**
     * Sock onmessage listener
     * @private
     */
    Transport.prototype._onmessage = function (e) {
      logger.trace('received message', e.data);
      if (e.data === 'hb') {
        this._lastHeartbeat = Date.now();
      } else {
        var msg = decode(e.data);

        if (msg.type === 'negotiate') {
          return this._events.emit('negotiate', null, msg);
        }

        msg && this.emit('message', msg);
      }
    };

    /**
     * Negotiate server protocol (get heartbeatFreq and detect a websocket issue)
     * @param {function} done
     * @private
     */
    Transport.prototype._negotiate = function (cb) {
      var _this = this;

      this._events.once('negotiate', function (err, msg) {
        if (err) {
          logger.trace('negotiation timeout');
          _.remove(_this._whitelist, function (item) {
            return item === 'websocket';
          });
          if (_this._sock.protocol === 'websocket') {
            _this.disconnect(function () {
              _this._negotiating = false;
              _this.connect();
            });
          } else {
            cb && cb({code: 'NEGOTIATIONERR'});
          }
          this.emit('error', {code: _this._locked ? 'BUSY' : 'ALREADYDISCONN'});
          return;
        }
        if (msg && typeof(msg.heartbeatFreq) === "number" && msg.heartbeatFreq > 0) _this._heartbeatFreq = msg.heartbeatFreq;
        _this._negotiating = false;
        logger.trace('negotiation sucessful');
        cb && cb();
      });

      setTimeout(function () {
        _this._events.emit('negotiate', {code: 'TIMEOUT'})
      }, negoationTimeout);

      _this._negotiating = true;
      logger.trace(this._sock.protocol + ' protocol; Protocol negotiation');
      var negotiate = encode({type: 'negotiate'});
      this._sock.send(negotiate);
    };

    return Transport;
  })();

  /**
   * Encode data
   * @param {*} data
   * @returns {string} encoded data
   */
  function encode(data) {
    var encodedData = null;
    try {
      encodedData = JSON.stringify(data);
    } catch (err) {
      logger.warn('failed encoding data', data, err);
    }
    return encodedData;
  }

  /**
   * Decode data
   * @param {string} data
   * @returns {*} decoded data
   */
  function decode(data) {
    var decodedData = null;
    try {
      decodedData = JSON.parse(data);
    } catch (err) {
      logger.warn('failed decoding data', data, err);
    }
    return decodedData;
  }

  return exports;
});
