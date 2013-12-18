define(['sockjs', 'util', 'events', 'logger'], function (SockJS, util, EventEmitter, loggerManager) {
  'use strict';

  var logger = loggerManager.getLogger('hubiquitus:transport');
  var connTimeout = 10000;
  var reconnDelay = 3000;

  var exports = (function () {

    /**
     * Transport layer
     * @param {object} [options]
     * @constructor
     */
    function Transport(options) {
      EventEmitter.call(this);
      options = options || {};
      this._sock = null;
      this._started = false;
      this._locked = false;
      this._autoReconnect = options.autoReconnect || false;
      this._shouldReconnect = false;
      this._reconnecting = false;
      this._wsEnabled = true;
      this.endpoint = null;
    }

    util.inherits(Transport, EventEmitter);

    /**
     * Connect to endpoint
     * @param {string} [endpoint]
     */
    Transport.prototype.connect = function (endpoint) {
      if ((this._locked && !this._reconnecting) || this._started) {
        logger.warn((this._locked ? 'busy' : 'already started'), '; cant connect ' + endpoint);
        this.emit('error', {code: this._locked ? 'BUSY' : 'ALREADYCONN'});
        return;
      }

      if (!this._reconnecting) {
        this._locked = true;
        if (this._autoReconnect) this._shouldReconnect = true;
      }

      if (endpoint) this.endpoint = endpoint;
      this._sock = new SockJS(this.endpoint);

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
     */
    Transport.prototype.disconnect = function () {
      if ((this._locked && !this._reconnecting) || !this._started) {
        logger.warn((this._locked ? 'busy' : 'already stopped'), '; cant disconnect');
        this.emit('error', {code: this._locked ? 'BUSY' : 'ALREADYDISCONN'});
        return;
      }

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
      logger.info(this._reconnecting ? 'reconnected' : 'connected');
      this._started = true;
      this._locked = false;
      this.emit(this._reconnecting ? 'reconnect' : 'connect');
      this._reconnecting = false;
    };

    /**
     * Sock close listener
     * @private
     */
    Transport.prototype._onclose = function () {
      this._sock = null;
      this._started = false;

      if (!this._shouldReconnect) {
        this._locked = false;
        logger.info('disconnected');
        this.emit('disconnect');
      } else if (!this._reconnecting) {
        this._reconnecting = true;
        var _this = this;
        (function reconnect() {
          if (_this._started || !_this._shouldReconnect) return;
          logger.info('reconnecting');
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
      var msg = decode(e.data);
      msg && this.emit('message', msg);
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
