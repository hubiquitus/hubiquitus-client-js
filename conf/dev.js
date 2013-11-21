({
  baseUrl: '../',
  out: '../build/hubiquitus.js',
  name: 'hubiquitus',
  paths: {
    sockjs: 'vendor/sockjs',
    events: 'lib/events',
    uuid: 'lib/uuid',
    lodash: 'vendor/lodash'
  },
  shim: {
    'sockjs': {exports: ['SockJS']},
    'lodash': {exports: ['_']}
  },
  optimize: 'none'
})
