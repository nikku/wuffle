const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');

const { preExit } = require('../util');


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

    let start = Date.now();

    return upload(store.asJSON()).then(() => {
      log.info(params, 'dumped in %sms', Date.now() - start);
    }).catch(err => {
      log.error(params, 'dump failed', err);
    });
  }

  function restoreStore() {

    let start = Date.now();

    return download().then(dump => {

      store.loadJSON(dump);

      log.info(params, 'restored in %sms', Date.now() - start);
    }).catch(err => {
      log.warn(params, 'restore failed', err);
    });
  }


  // dump every 30 seconds
  const dumpInterval = 1000 * 30;

  setInterval(dumpStore, dumpInterval);

  // dump on exit
  preExit(function() {
    log.info('pre-exit dump');

    return dumpStore();
  });

  // restore, initally
  return restoreStore();
};