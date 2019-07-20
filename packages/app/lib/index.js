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
  require('./apps/org-auth'),
  require('./apps/user-auth'),
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

  const log = app.log.child({
    name: 'wuffle'
  });

  const config = loadConfig(log);

  const columns = new Columns(config.columns);

  const storeLog = app.log.child({
    name: 'wuffle:store'
  });

  const store = new Store(columns, storeLog);


  // public API ////////////////////

  app.store = store;


  // load child apps ///////////////

  for (const appFn of apps) {
    await appFn(app, config, store);
  }

  log.info('wuffle started');

};