import { AsyncInjector } from 'async-didi';
import { preExit } from './util/index.js';

const appModules = [
  import('./apps/log-events.js'),
  import('./apps/webhook-events/index.js'),
  import('./apps/route-compression.js'),
  import('./apps/route-https.js'),
  (
    process.env.S3_BUCKET
      ? import('./apps/dump-store/s3/index.js')
      : import('./apps/dump-store/local/index.js')
  ),
  import('./apps/events-sync.js'),
  import('./apps/github-app/index.js'),
  import('./apps/github-issues/index.js'),
  import('./apps/github-comments/index.js'),
  import('./apps/github-client/index.js'),
  import('./apps/github-checks/index.js'),
  import('./apps/github-reviews/index.js'),
  import('./apps/github-statuses/index.js'),
  import('./apps/security-context/index.js'),
  import('./apps/user-access/index.js'),
  import('./apps/search/index.js'),
  import('./apps/background-sync/index.js'),
  import('./apps/automatic-dev-flow.js'),
  import('./apps/auth-routes/index.js'),
  import('./apps/board-api-routes/index.js'),
  import('./apps/board-routes.js'),
  import('./apps/reindex-store.js')
];

import loadConfig from './load-config.js';
import Store from './store.js';
import AsyncEvents from './events.js';
import Columns from './columns.js';


/**
 *
 * @param {import('./types.js').ProbotApp} app
 *
 * @return {Promise<any>}
 */
export default function Wuffle(app, { getRouter }) {

  const logger = app.log;

  const log = logger.child({
    name: 'wuffle:core'
  });


  async function setup() {

    // intialize ///////////////////

    const router = getRouter();

    const config = await loadConfig(log);

    const events = new AsyncEvents();

    // load child apps //////////////

    const apps = await Promise.all(appModules).then(apps => apps.map(app => app.default));

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

    await injector.init();

    await events.emit('wuffle.start');

    log.debug('Initialized');

    preExit(async () => {

      log.info('Closing...');

      await events.emit('wuffle.pre-exit');

      log.info('Closed');
    });
  }

  return setup();
}