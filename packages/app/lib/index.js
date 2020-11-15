const { AsyncInjector } = require('async-didi');

const { preExit } = require('./util');

const apps = [
  require('./apps/log-events'),
  require('./apps/webhook-events'),
  require('./apps/route-compression'),
  require('./apps/route-https'),
  (
    process.env.S3_BUCKET
      ? require('./apps/dump-store/s3')
      : require('./apps/dump-store/local')
  ),
  require('./apps/events-sync'),
  require('./apps/github-app'),
  require('./apps/github-issues'),
  require('./apps/github-client'),
  require('./apps/github-checks'),
  require('./apps/github-reviews'),
  require('./apps/github-statuses'),
  require('./apps/security-context'),
  require('./apps/user-access'),
  require('./apps/search'),
  require('./apps/background-sync'),
  require('./apps/automatic-dev-flow'),
  require('./apps/auth-routes'),
  require('./apps/board-api-routes'),
  require('./apps/board-routes'),
  require('./apps/reindex-store')
];

const loadConfig = require('./load-config');

const Store = require('./store');

const AsyncEvents = require('./events');

const Columns = require('./columns');


module.exports = function(app) {

  const logger = app.log;

  const log = logger.child({
    name: 'wuffle'
  });


  async function setup() {

    // intialize ///////////////////

    const router = app.router;

    const config = loadConfig(log);

    const events = new AsyncEvents();

    // load child apps //////////////

    const modules = apps.map(app => {

      if (typeof app === 'function') {
        return {
          __init__: [ app ]
        };
      }

      return app;
    });

    const coreModule = {
      'app': [ 'value', app ],
      'config': [ 'value', config ],
      'router': [ 'value', router ],
      'logger': [ 'value', logger ],
      'columns': [ 'type', Columns ],
      'store': [ 'type', Store ],
      'events': [ 'value', events ]
    };

    const injector = new AsyncInjector([
      coreModule,
      ...modules
    ]);

    // initialize modules ////////////

    for (const module of modules) {

      const init = /** @type {import('./types').DidiModule} */ (module).__init__ || [];

      for (const component of init) {
        await injector[typeof component === 'function' ? 'invoke' : 'get'](component);
      }

    }

    await events.emit('wuffle.start');

    log.info('started');

    preExit(function() {

      log.info('pre-exit');

      return events.emit('wuffle.pre-exit');
    });
  }

  return setup().catch(
    err => {
      log.fatal('failed to create app', err);

      process.exit(21);
    }
  );
};