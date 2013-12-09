define(['util', 'lodash'], function (util, _) {
  'use strict';

  var levels = {trace: 0, debug: 1, info: 2, warn: 3, err: 4};
  var loggers = {};
  var enabled = {};

  var manager = function (namespace) {
    var logger = loggers[namespace];
    if (!logger) {
      logger = new Logger(namespace);
      loggers[namespace] = logger;
      _.forEach(_.keys(enabled), function (item) {
        if ((new RegExp(item)).test(namespace)) {
          logger.enabled = true;
          logger.level = enabled[item] || 'info';
        }
      });
    }
    return logger;
  };
  manager.getLogger = manager;

  manager.enable = function (namespace, level) {
    var regex = namespace2regex(namespace);
    enabled[regex] = level;
    var namespaces = matchingNamespaces(regex);
    _.forEach(namespaces, function (item) {
      var logger = loggers[item];
      if (logger) {
        logger.enabled = true;
        if (level) logger.level = level;
      }
    });
  };

  manager.disable = function (namespace) {
    var regex = namespace2regex(namespace);
    delete enabled[regex];
    var namespaces = matchingNamespaces(regex);
    _.forEach(namespaces, function (item) {
      var logger = loggers[item];
      if (logger) logger.enabled = false;
    });
  };

  manager.level = function (namespace, level) {
    var regex = namespace2regex(namespace);
    var namespaces = matchingNamespaces(regex);
    _.forEach(namespaces, function (item) {
      var logger = loggers[item];
      if (logger) logger.level = level;
    });
  };

  function namespace2regex(namespace) {
    return '^' + namespace.replace('*', '.*?') + '$';
  }

  function matchingNamespaces(regex) {
    var re = new RegExp(regex);
    return _.filter(_.keys(loggers), function (key) {
      return re.test(key);
    });
  }

  function Logger(namespace) {
    this.namespace = namespace;
    this.enabled = false;
    this.level = 'info';
  }

  _.forEach(_.keys(levels), function (level) {
    Logger.prototype[level] = function () {
      return internalLog(this, level, Array.prototype.slice.call(arguments));
    };
  });

  var internalLog = function (logger, level, messages) {
    var errid = util.uuid();
    if (logger.enabled && levels[level] >= levels[logger.level]) {
      manager.log(logger.namespace, level, messages);
    }
    return errid;
  };

  manager.log = function (namespace, level, messages) {
    var header = '[' + namespace + '][' + level + '][' + new Date() + ']';
    messages.unshift(header);
    if (typeof console !== 'undefined' && console.log) {
      console.log.apply(console, messages);
    }
  };

  return manager;
});
