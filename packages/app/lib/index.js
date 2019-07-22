const { AsyncInjector } = require('async-didi');

const apps = [
  require('./apps/log-events'),
  require('./apps/route-compression'),
  require('./apps/route-https'),
  (
    process.env.S3_BUCKET
      ? require('./apps/dump-store-s3')
      : require('./apps/dump-store')
  ),
  require('./apps/on-active'),
  require('./apps/installations'),
  require('./apps/github'),
  require('./apps/context'),
  require('./apps/events-sync'),
  require('./apps/user-access'),
  require('./apps/search'),
  require('./apps/background-sync'),
  require('./apps/automatic-dev-flow'),
  require('./apps/auth-routes'),
  require('./apps/board-api-routes'),
  require('./apps/board-routes')
];

const loadConfig = require('./load-config');

const Store = require('./store');

const Columns = require('./columns');


module.exports = async app => {

  // intialize ///////////////////

  const logger = app.log;
  const router = app.router;

  const log = logger.child({
    name: 'wuffle'
  });

  const config = loadConfig(log);

  // load child apps ///////////////

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
    'store': [ 'type', Store ]
  };

  const injector = new AsyncInjector([
    coreModule,
    ...modules
  ]);

  // initialize modules

  for (const module of modules) {

    const init = module.__init__ || [];

    for (const component of init) {
      await injector[typeof component === 'function' ? 'invoke' : 'get'](component);
    }

  }

  log.info('wuffle started');

};