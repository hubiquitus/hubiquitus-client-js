if (!window.hubiquitus) window.hubiquitus = {};

window.hubiquitus._util = (function () {
  'use strict';

  var util = {};

  if (!Object.create) {
    Object.create = (function () {
      function F() {}

      return function (o) {
        F.prototype = o;
        return new F();
      };
    })();
  }

  util.inherits = function (ctor, superCtor) {
    ctor._super = superCtor;
    ctor.prototype = Object.create(superCtor.prototype);
    ctor.prototype.constructor = ctor;
  };

  util.uuid = function () {
    var uuid = '', i, random;
    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;

      if (i == 8 || i == 12 || i == 16 || i == 20) {
        uuid += '-';
      }
      uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
  };

  return util;
})();
