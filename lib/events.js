"use strict";

define([], function () {
  var events = {};

  function on(event, cb) {
    if (!events[event]) events[event] = [];
    events[event].push(cb);
    return this;
  }

  function once(event, cb) {
    if (!events[event]) events[event] = [];
    var fired = false;
    on(event, function tmp() {
      remove(event, tmp);
      if (!fired) {
        fired = true;
        cb.apply(this, arguments);
      }
    });
    return this;
  }

  function remove(event, cb) {
    if (!events[event]) return this;
    var len = events[event].length;
    for (var i = 0; i < len; i++) {
      if (events[event][i] === cb) {
        delete events[event][i];
        break;
      }
    }
    return this;
  }

  function emit(event) {
    if (!events[event]) return this;
    var i, len;
    len = arguments.length;
    var args = new Array(len - 1);
    for (i = 1; i < len; i++) {
      args[i - 1] = arguments[i];
    }
    len = events[event].length;
    for (i = 0; i < len; i++) {
      events[event][i].apply(this, args);
    }
    return this;
  }

  return {
    addListener: on,
    on: on,
    once: once,
    removeListener: remove,
    emit: emit
  };
});
