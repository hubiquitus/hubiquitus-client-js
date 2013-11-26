define(['lodash', 'sockjs', 'util', 'events', 'logger'], function (_, sock, util, EventEmitter, logger) {
  'use strict';

  var defaultSendTimeout = 30000;
  var maxSendTimeout = 5 * 3600000;

  return window.Hubiquitus = (function() {

    function Hubiquitus() {
      EventEmitter.call(this);
      this._locked = false;
      this._sock = null;
      this.id = null;
    }

    util.inherits(Hubiquitus, EventEmitter);

    Hubiquitus.prototype.connect = function (endpoint, authData, cb) {
      logger.info('connect');
    };

    Hubiquitus.prototype.disconnect = function () {
      logger.info('disconnect');
    };

    Hubiquitus.prototype.send = function (to, content, timeout, cb) {
      logger.info('send');
    };

    return Hubiquitus;
  })();


  // TMP DISABLED


  var sock = null;
  var exports = {};

  exports.id = null;

  /**
   * Connect a hubiquitus container
   * @param addr {string} connection addr
   */
  exports.connect = function (addr, authData) {
    if (sock) exports.disconnect();
    sock = new SockJS(addr);

    sock.onopen = function () {
      console.log('Hubiquitus connected to ' + addr);
      events.emit('hubiquitus started');
      if (!exports.id) {
        var message = {authData: authData, type: 'login'};
        console.log('Hubiquitus login ', message);
        sock.send(JSON.stringify(message));
      }
    };

    sock.onclose = function () {
      console.log('Hubiquitus disconnected from ' + addr);
      events.emit('hubiquitus stopped');
    };

    sock.onmessage = function (e) {
      console.log('Hubiquitus received a message from ' + addr);
      onMessageInternal(e.data);
    };
  };

  /**
   * Disconnect from hubiquitus container
   */
  exports.disconnect = function () {
    sock && sock.close();
    sock = null;
  };

  /**
   * Sends a message to a foreign actor actor
   * @param to {string} target actor id
   * @param content {*} message content
   * @param [timeout] {number} message feedback timeout
   * @param [cb] {function} message feedback
   */
  exports.send = function (to, content, timeout, cb) {
    if (_.isFunction(timeout)) { cb = timeout; timeout = defaultSendTimeout; }
    timeout = timeout ||  maxSendTimeout;

    var message = {to: to, payload: {content: content}, id: uuid(), date: (new Date()).getTime(), type: 'message'};

    events.once('response|' + message.id, function (err, response) {
      return err ? cb(err) : cb(response.payload.err, response.payload.content);
    });

    setTimeout(function () {
      events.emit('response|' + message.id, 'TIMEOUT');
    }, timeout);

    console.log('Hubiquitus sending ', message);
    sock.send(JSON.stringify(message));
  };

  /**
   * Internal message handler
   * @param data {string} incomming json data
   */
  function onMessageInternal (data) {
    var message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      return console.log('Hubiquitus failed to parse incomming message', data);
    }
    switch (message.type) {
      case ' ':
        console.log('Hubiquitus processing message', message);
        exports.onMessage(message.from, message.payload.content, function (err, content) {
          var response = {to: message.from, id: message.id, payload: {err: err, content: content}, type: 'response'};
          sock.send(response);
        });
        break;
      case 'response':
        console.log('Hubiquitus processing response', message);
        events.emit('response|' + message.id, null, message);
        break;
      case 'login':
        console.log('Hubiquitus login feedback', message);
        exports.id = message.aid;
        events.emit('login', exports.id);
        break;
      default:
        console.log('Hubiquitus received unknown message type', message);
    }
  }
});
