const fs = require('fs');

/**
 * This component restores a store dump on startup and periodically
 * persists the store to disc.
 *
 * @param  {Application} app
 * @param  {Object} config
 * @param  {Store} store
 */
module.exports = async (app, config, store) => {

  const log = app.log.child({
    name: 'wuffle:dump-store'
  });


  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const storeLocation = 'tmp/storedump.json';


  function dumpStore() {

    const {
      issues,
      lastSync,
      issueOrder
    } = store;

    const dump = JSON.stringify({
      issues,
      lastSync,
      issueOrder
    });

    log.info({ storeLocation }, 'success');

    fs.writeFile(storeLocation, dump, 'utf8', function(err) {
      if (err) {
        return log.warn({ storeLocation }, 'error', err);
      }
    });
  }

  function restoreStore() {

    fs.readFile(storeLocation, 'utf8', function(err, contents) {

      if (err) {
        return log.warn({ storeLocation }, 'restore failed', err);
      }

      try {
        const {
          issues,
          lastSync,
          issueOrder
        } = JSON.parse(contents);

        store.issues = issues || [];
        store.lastSync = lastSync;
        store.issueOrder = issueOrder || {};

        log.info({ storeLocation }, 'restored');
      } catch (err) {
        log.warn({ storeLocation }, 'restore failed', err);
      }
    });
  }

  // one minute
  const dumpInterval = 1000 * 60 * 1;

  setInterval(dumpStore, dumpInterval);

  restoreStore();
};