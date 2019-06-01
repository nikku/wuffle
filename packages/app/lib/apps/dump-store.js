const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');

const exitHook = require('exit-hook2');

/**
 * This component restores a store dump on startup and periodically
 * persists the store to disc.
 *
 * @param  {Application} app
 * @param  {Object} config
 * @param  {Store} store
 */
module.exports = async (app, config, store) => {

  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const log = app.log.child({
    name: 'wuffle:dump-store'
  });

  const storeLocation = 'tmp/storedump.json';

  const params = { storeLocation };


  // io helpers

  function upload(dump) {

    return new Promise((resolve, reject) => {
      mkdirp(path.dirname(storeLocation), function(err) {

        if (err) {
          reject(err);
        } else {
          fs.writeFile(storeLocation, dump, 'utf8', function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  function download() {

    return new Promise((resolve, reject) => {
      fs.readFile(storeLocation, 'utf8', function(err, contents) {

        if (err) {
          reject(err);
        } else {
          resolve(contents);
        }
      });
    });
  }


  // impl

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
    }, null, '  ');

    return upload(dump).then(() => {
      log.info(params, 'dumped');
    }).catch(err => {
      log.error(params, 'dump failed', err);
    });
  }

  function restoreStore() {

    return download().then(dump => {

      const {
        issues,
        lastSync,
        issueOrder
      } = JSON.parse(dump);

      store.issues = issues || [];
      store.lastSync = lastSync;
      store.issueOrder = issueOrder || {};

      log.info(params, 'restored');
    }).catch(err => {
      log.warn(params, 'restore failed', err);
    });
  }


  // dump every three minutes
  const dumpInterval = 1000 * 60 * 3;

  setInterval(dumpStore, dumpInterval);

  // dump on exit
  exitHook(function(canCancel, signal, code) {

    if (canCancel) {
      exitHook.removeListener(this);

      dumpStore().finally(() => {
        process.exit(code);
      });

      return false;
    }
  });

  // restore, initally
  return restoreStore();
};