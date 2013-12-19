define(['lodash', 'transport', 'util', 'events', 'logger'], function (_, Transport, util, EventEmitter, loggerManager) {
  'use strict';

  var logger = loggerManager.getLogger('hubiquitus');

  var defaultSendTimeout = 30000;
  var maxSendTimeout = 5 * 3600000;
  var authTimeout = 3000;

  var exports = window.Hubiquitus = (function() {

    /**
     * Hubiquitus client
     * @param {object} [options]
     * @constructor
     */
    function Hubiquitus(options) {
      EventEmitter.call(this);
      options = options || {};
      this._transport = new Transport({autoReconnect: options.autoReconnect || false});
      this._events = new EventEmitter();
      this._authentified = false;
      this._authData = null;
      this.id = null;
      this._connected = false;

      var _this = this;
      var reconnecting = false;

      this._transport.on('error', function (err) {
        _this.emit('error', err);
      });

      this._transport.on('connect', function () {
        reconnecting = false;
        _this.connected = true;
        _this._login(_this._authData);
      });

      this._transport.on('reconnect', function () {
        reconnecting = true;
        _this.connected = true;
        _this._login(_this._authData);
      });

      this._transport.on('disconnect', function () {
        _this._authentified = false;
        if (_this.connected) _this.emit('disconnect');
        _this.connected = false;
      });

      this._transport.on('message', function (msg) {
        switch (msg.type) {
          case 'req':
            _this._onReq(msg);
            break;
          case 'res':
            _this._events.emit('res|' + msg.id, msg);
            break;
          case 'login':
            _this._authentified = true;
            _this.id = msg.content.id;
            logger.info('logged in; identifier is', _this.id);
            _this.emit(reconnecting ? 'reconnect' : 'connect');
            break;
          default:
            logger.warn('received unknown message type', msg);
        }
      });
    }

    util.inherits(Hubiquitus, EventEmitter);

    Hubiquitus.prototype.util = util;

    /**
     * Connect to endpoint with given credentials
     * @param {string} endpoint
     * @param {object} authData
     * @returns {Hubiquitus}
     */
    Hubiquitus.prototype.connect = function (endpoint, authData) {
      this._authData = authData;
      this._transport.connect(endpoint);
      return this;
    };

    /**
     * Disconnect from endpoint
     * @returns {Hubiquitus}
     */
    Hubiquitus.prototype.disconnect = function () {
      this._transport.disconnect();
      return this;
    };

    /**
     * Send a message to endpoint
     * @param {string} to
     * @param {*} content
     * @param {number|function} [timeout]
     * @param {function} [cb]
     * @returns {Hubiquitus}
     */
    Hubiquitus.prototype.send = function (to, content, timeout, cb) {
      if (_.isFunction(timeout)) { cb = timeout; timeout = defaultSendTimeout; }

      var _this = this;

      timeout = _.isNumber(timeout) ? timeout : maxSendTimeout;
      var req = {to: to, content: content, id: util.uuid(), date: (new Date()).getTime(), type: 'req'};
      if (cb) req.cb = true;

      _this._events.once('res|' + req.id, function (res) {
        _this._onRes(res, cb);
      });

      setTimeout(function () {
        _this._events.emit('res|' + req.id, {err: {code: 'TIMEOUT'}, id: req.id});
      }, timeout);

      logger.trace('sending request', req);
      this._transport.send(req, function (err) {
        if (err) _this.emit('res|' + req.id, {err: {code: 'TECHERR'}, id: req.id});
      });

      return this;
    };

    /**
     * Request handler
     * @param {object} req
     * @private
     */
    Hubiquitus.prototype._onReq = function (req) {
      logger.trace('processing message', req);
      var _this = this;
      req.reply = function (err, content) {
        var res = {to: req.from, id: req.id, err: err, content: content, type: 'res'};
        _this._transport.send(res);
      };
      try {
        this.emit('message', req);
      } catch (err) {
        logger.warn('processing request error', {req: req, err: err});
      }
    };

    /**
     * Response handler
     * @param {object} res
     * @param cb {function} original request callback
     * @private
     */
    Hubiquitus.prototype._onRes = function (res, cb) {
      logger.trace('processing response', res);
      try {
        cb && cb(res.err, res);
      } catch (err) {
        logger.warn('processing response error', {res: res, err: err});
      }
    };

    /**
     * Login endpoint
     * @param {object} authData
     * @private
     */
    Hubiquitus.prototype._login = function (authData) {
      var _this = this;
      setTimeout(function () {
        if (!_this._authentified) {
          _this.emit('error', {code: 'AUTHTIMEOUT'});
          _this.disconnect();
        }
      }, authTimeout);
      var msg = {type: 'login', authData: authData};
      logger.trace('try to login', msg);
      this._transport.send(msg);
    };

    return Hubiquitus;
  })();

  exports.logger = loggerManager;
  return exports;
});
