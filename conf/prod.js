({
  baseUrl: '../',
  out: '../build/hubiquitus.min.js',
  name: 'hubiquitus',
  paths: {
    sockjs: 'vendor/sockjs',
    lodash: 'vendor/lodash',
    transport: 'lib/transport',
    events: 'lib/events',
    logger: 'lib/logger',
    util: 'lib/util'
  },
  shim: {
    'sockjs': {exports: ['SockJS']},
    'lodash': {exports: ['_']}
  }
})
