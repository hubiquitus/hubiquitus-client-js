if (!window.hubiquitus) window.hubiquitus = {};

window.hubiquitus._Transport = (function () {
  'use strict';

  var util = window.hubiquitus._util;
  var EventEmitter = window.hubiquitus._EventEmitter;
  var loggerManager = window.hubiquitus._loggerManager;

  var logger = loggerManager.getLogger('hubiquitus:transport');
  var connTimeout = 10000;
  var negotiationTimeout = 2000;
  var heartbeatFreq = 15000;

  var Status = {
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
    BUSY: 'BUSY'
  };

  var Transport = (function () {

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
      this._events = new EventEmitter();

      this._whitelist = ['xdr-streaming', 'xhr-streaming', 'iframe-eventsource', 'iframe-htmlfile', 'xdr-polling', 'xhr-polling', 'iframe-xhr-polling', 'jsonp-polling'];
      this._heartbeatFreq = options.heartbeatFreq || heartbeatFreq;
      this._lastHeartbeat = -1;
      this._ws = true;
      this._wsErr = false;
      this._connTimeoutHandle = null;
      this._negotiateTimeoutHandle = null;

      this._status = Status.DISCONNECTED;
    }

    util.inherits(Transport, EventEmitter);

    /**
     * Connect to endpoint
     * @param {string} [endpoint]
     */
    Transport.prototype.connect = function (endpoint) {
      logger.trace('connecting...');

      if(this._status !== Status.DISCONNECTED) {
        logger.debug(((this._status === Status.BUSY) ? 'busy' : 'already connected'), '; cant connect ' + endpoint);
        return;
      }

      if (endpoint) this.endpoint = endpoint;
      this._status = Status.BUSY;
      this._connect(endpoint);
    };

    /**
     * Disconnect from endpoint
     */
    Transport.prototype.disconnect = function () {
      logger.trace('disconnecting...');

      if(this._status === Status.DISCONNECTED) {
        logger.debug(((this._status === Status.BUSY) ? 'busy' : 'already disconnected'), '; cant disconnect ');
        return;
      }

      this._disconnect();
    };

    Transport.prototype._connect = function() {
      this._lastHeartbeat = -1;
      this._wsErr = false;
      var protocolList = this._whitelist;
      if (this._ws) protocolList = ['websocket'].concat(protocolList);
      this._sock  = new SockJS(this.endpoint, null, {protocols_whitelist: protocolList});

      this._sock.onopen = this._onopen.bind(this);
      this._sock.onclose = this._onclose.bind(this);
      this._sock.onmessage = this._onmessage.bind(this);

      var _this = this;
      this._connTimeoutHandle = setTimeout(function () {
        if (_this._status === Status.BUSY) {
          _this._disconnect({code: 'CONNTIMEOUT'});
        }
      }, connTimeout);
    };

    /**
     * Send a message to endpoint
     * @param {*} msg
     * @param {function} [cb]
     */
    Transport.prototype.send = function (msg, cb) {
      var encodedMsg = encode(msg);
      encodedMsg && this._sock && this._sock.send(encodedMsg);
      cb && cb();
    };

    /**
     * Sock open listener
     * @private
     */
    Transport.prototype._onopen = function () {
      var _this = this;

      this._negotiate(function (err) {
        if (err) {
          logger.warn('Protocol negotiation error');
          _this._disconnect('Protocol negotiation error');
          return;
        }

        //Start heartbeat timer
        _this._lastHeartbeat = Date.now();

        logger.info('connected using ' + _this._sock.protocol);
        if (_this._status !== Status.CONNECTED) {
          _this._status = Status.CONNECTED;
          _this.emit('connected');
        }

        _this._checkConn();
      });
    };

    Transport.prototype._checkConn = function () {
      var _this = this;
      if (_this._status === Status.CONNECTED) {
        if (Date.now() - (_this._lastHeartbeat + _this._heartbeatFreq + (0.5 * _this._heartbeatFreq))  > 0) {
          logger.debug('Last heartbeat too old : ', _this._lastHeartbeat, ' freq : ', _this._heartbeatFreq);
          _this._disconnect('HBTIMEOUT');
        }
        setTimeout(function () {
          _this._checkConn();
        }, _this._heartbeatFreq);
      }
    };

    Transport.prototype._disconnect = function (err) {
      if (err) logger.info('Disconnected with error : ', err);

      this._sock && this._sock.close();
      this._clear();

      if (!this._wsErr) {
        this._status = Status.DISCONNECTED;
        this.emit('disconnected', err);
      }
    };

    /**
     * Sock close listener
     * @private
     */
    Transport.prototype._onclose = function () {
      logger.info('disconnected');
      this._disconnect();
    };

    /**
     * Sock onmessage listener
     * @private
     */
    Transport.prototype._onmessage = function (e) {
      logger.trace('received message', e.data);
      if (e.data === 'hb') {
        this._lastHeartbeat = Date.now();
        this._sock && this._sock.send('hb');
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
     * @param {function} cb
     * @private
     */
    Transport.prototype._negotiate = function (cb) {
      var _this = this;

      this._events.once('negotiate', function (err, msg) {
        if (err) {
          logger.trace('negotiation timeout');
          if (_this._ws) {
            _this._wsErr = true;
            _this._ws = false;
            _this._disconnect();
            _this._connect();
          } else {
            cb && cb({code: 'NEGOTIATIONERR'});
          }
          return;
        }

        if (msg && typeof(msg.heartbeatFreq) === 'number' && msg.heartbeatFreq > 0) _this._heartbeatFreq = msg.heartbeatFreq;
        logger.trace('negotiation sucessful');
        cb && cb();
      });

      this._negotiateTimeoutHandle = setTimeout(function () {
        _this._events.emit('negotiate', {code: 'NEGOTIATIONTIMEOUT'});
      }, negotiationTimeout);

      logger.trace(this._sock.protocol + ' protocol; Protocol negotiation');
      var negotiate = encode({type: 'negotiate'});
      this._sock && this._sock.send(negotiate);
    };

    Transport.prototype._clear = function () {
      if (this._sock) {
        this._sock.onopen = null;
        this._sock.onclose = null;
        this._sock.onmessage = null;
        this._sock = null;
      }

      clearTimeout(this._connTimeoutHandle);
      this._connTimeoutHandle = null;
      clearTimeout(this._negotiateTimeoutHandle);
      this._negotiateTimeoutHandle = null;

      this._lastHeartbeat = -1;
      this._wsErr = false;
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

  return Transport;
})();
