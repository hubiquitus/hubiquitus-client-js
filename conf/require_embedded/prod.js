({
  baseUrl: '../../',
  out: '../../build/require_embedded/hubiquitus.min.js',
  name: 'hubiquitus',
  paths: {
    requireLib: 'vendor/require',
    sockjs: 'vendor/sockjs',
    events: 'lib/events',
    uuid: 'lib/uuid',
    lodash: 'vendor/lodash'
  },
  include: 'requireLib',
  shim: {
    'sockjs': {exports: ['SockJS']},
    'lodash': {exports: ['_']}
  }
})
