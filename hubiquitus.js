define(['sockjs', 'lodash', 'uuid', 'events'], function (SockJS, _, uuid, events) {
  'use strict';

  var defaultSendTimeout = 30000;
  var maxSendTimeout = 5 * 3600000;

  var sock = null;
  var exports = {};

  /**
   * Connect a hubiquitus container
   * @param addr {string} connection addr
   */
  exports.connect = function (addr) {
    if (sock) exports.disconnect();
    sock = new SockJS(addr);

    sock.onopen = function () {
      console.log('Hubiquitus connected to ' + addr);
      events.emit('hubiquitus started');
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
   * Authentification
   * @param login {string} username
   */
  exports.login = function (login) {
    var message = {login: login, type: 'login'};
    sock.send(JSON.stringify(message));
  };

  /**
   * Message handler; to be overriden
   * @param from {string} sender actor id
   * @param content {*} message content
   * @param reply {function} callback to send a response
   */
  exports.onMessage = function (from, content, reply) {
    console.err('Hubiquitus onMessage should be overriden');
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
      case 'message':
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
      default:
        console.log('Hubiquitus received unknown message type', message);
    }
  }

  exports.events = events;
  window.hubiquitus = exports;
  return exports;
});
