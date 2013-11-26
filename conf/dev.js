({
  baseUrl: '../',
  out: '../build/hubiquitus.js',
  name: 'hubiquitus',
  paths: {
    sockjs: 'vendor/sockjs',
    lodash: 'vendor/lodash',
    events: 'lib/events',
    logger: 'lib/logger',
    util: 'lib/util'
  },
  shim: {
    'sockjs': {exports: ['SockJS']},
    'lodash': {exports: ['_']}
  },
  optimize: 'none'
})
