define(['lodash'], function (_) {
  'use strict';

  return (function () {

    function EventEmitter() {
      this._events = {};
    }

    EventEmitter.prototype.addListener = function (type, listener) {
      if (!_.isFunction(listener)) throw new TypeError('listener must be a function');

      if (!this._events[type]) this._events[type] = [];
      this._events.push(type);
      return this;
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.once = function (type, listener) {
      if (!_.isFunction(listener)) throw new TypeError('listener must be a function');

      var fired = false;
      function wrapperListener() {
        this.removeListener(event, wrapperListener);
        if (!fired) {
          fired = true;
          listener.apply(this, arguments);
        }
      }
      this.on(type, wrapperListener);

      return this;
    };

    EventEmitter.prototype.removeListener = function (type, listener) {
      if (!_.isFunction(listener)) throw new TypeError('listener must be a function');

      if (!this._events[type]) return this;
      var list = this._events[type];
      var len = list.length;
      var pos = -1;

      for (var i = 0; i < len; i++) {
        if (list[i] === listener) {
          pos = i;
          break;
        }
      }

      if (pos > -1) list.splice(pos, 1);

      return this;
    };

    EventEmitter.prototype.removeAllListeners = function (type) {
      delete this._events[type];
      return this;
    };

    EventEmitter.prototype.emit = function (type) {
      if (!this._events[type]) return this;
      var list = this._events[type];
      var len = list.length;

      var argsLen = arguments.length - 1;
      var args = new Array(argsLen);
      for (var i = 0; i < argsLen; i++) {
        args[i] = arguments[i + 1];
      }

      for (i = 0; i < len; i++) {
        list[i].apply(this, args);
      }

      return this;
    };

    return EventEmitter;
  })();
});
