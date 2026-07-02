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
  import('./apps/events-sync/index.js'),
  import('./apps/github-app/index.js'),
  import('./apps/github-issues/index.js'),
  import('./apps/github-comments/index.js'),
  import('./apps/github-client/index.js'),
  import('./apps/github-checks/index.js'),
  import('./apps/github-reviews/index.js'),
  import('./apps/github-statuses/index.js'),
  import('./apps/issue-filter/index.js'),
  import('./apps/security-context/index.js'),
  import('./apps/user-access/index.js'),
  import('./apps/search/index.js'),
  import('./apps/background-sync/index.js'),
  import('./apps/automatic-dev-flow/index.js'),
  import('./apps/auth-routes/index.js'),
  import('./apps/board-api-routes/index.js'),
  import('./apps/board-routes.js'),
  import('./apps/reindex-store/index.js')
];

import loadConfig from './load-config.js';
import Store from './store.js';
import AsyncEvents from './events.js';
import Columns from './columns.js';


/**
 * @typedef { { router: import('express').Router } } WuffleOptions
 */

/**
 * @param { import('./types.js').ProbotApp } app
 * @param { WuffleOptions } options
 *
 * @return { Promise<any> }
 */
export default function Wuffle(app, { router }) {

  const logger = app.log;

  const log = logger.child({
    name: 'wuffle:core'
  });


  async function setup() {

    // intialize ///////////////////

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
      'config': [ 'value', config ],
      'logger': [ 'value', logger ],
      'columns': [ 'type', Columns ],
      'store': [ 'type', Store ],
      'events': [ 'value', events ]
    };

    const webModule = {
      'router': [ 'value', router ]
    };

    const probotModule = {
      'app': [ 'value', app ],
    };

    const injector = new AsyncInjector([
      coreModule,
      probotModule,
      webModule,
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