const {
  record
} = require('./recorder');

const apps = [
  require('./apps/dump-store'),
  require('./apps/on-active'),
  require('./apps/org-auth'),
  require('./apps/user-auth'),
  require('./apps/events-sync'),
  require('./apps/user-access'),
  require('./apps/search'),
  require('./apps/background-sync'),
  require('./apps/automatic-dev-flow'),
  require('./apps/auth-routes'),
  require('./apps/board-routes')
];

const loadConfig = require('./load-config');

const Store = require('./store');


module.exports = async app => {

  // intialize ///////////////////

  const config = loadConfig();

  const storeLog = app.log.child({
    name: 'wuffle:store'
  });

  const store = new Store(config, storeLog);


  // public API ////////////////////

  app.store = store;


  // load child apps ///////////////

  for (const appFn of apps) {
    await appFn(app, config, store);
  }


  // behavior //////////////////////

  if (process.env.NODE_ENV === 'development') {

    app.on('*', async context => {
      const {
        event,
        payload
      } = context;

      const {
        action
      } = payload;

      const eventName = action ? `${event}.${action}` : event;

      record(eventName, {
        type: 'event',
        payload
      });
    });

  }

};