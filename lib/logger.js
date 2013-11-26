define([], function () {
  'use strict';

  var exports = {};

  exports.level = 'info';

  var levels = {trace: 0, debug: 1, info: 2, warn: 3, err: 4};

  var log = function (level, messages) {
    if (levels[level] >= levels[exports.level]) {
      var header = '[Hubiquitus][' + level + '][' + new Date() + ']';
      messages.unshift(header);
      console.log.apply(console, messages);
    }
  };

  exports.trace = function () {
    log('trace', Array.prototype.slice.call(arguments));
  };

  exports.debug = function () {
    log('debug', Array.prototype.slice.call(arguments));
  };

  exports.info = function () {
    log('info', Array.prototype.slice.call(arguments));
  };

  exports.warn = function () {
    log('warn', Array.prototype.slice.call(arguments));
  };

  exports.err = function () {
    log('err', Array.prototype.slice.call(arguments));
  };

  exports.error = function () {
    log('err', Array.prototype.slice.call(arguments));
  };

  return exports;
});
