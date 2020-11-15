const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');


/**
 * This component restores a store dump on startup and periodically
 * persists the store to disc.
 *
 * @param {import("../../../types").Logger} logger
 * @param {import("../../../store")} store
 * @param {import("../../../events")} events
 */
function DumpStoreLocal(logger, store, events) {

  const log = logger.child({
    name: 'wuffle:dump-store-local'
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

  async function dumpStore() {

    let start = Date.now();

    try {
      const dump = await store.asJSON();

      await upload(dump);

      log.info({ ...params, t: Date.now() - start }, 'dumped');
    } catch (err) {
      log.error({ ...params, t: Date.now() - start }, 'dump failed', err);
    }
  }

  async function restoreStore() {

    let start = Date.now();

    try {
      const dump = await download();

      await store.loadJSON(dump);

      log.info({ ...params, t: Date.now() - start }, 'restored');
    } catch (err) {
      log.warn({ ...params, t: Date.now() - start }, 'restore failed', err);
    }
  }

  const DUMP_INTERVAL = process.env.NODE_ENV === 'development'

    // 30 seconds
    ? 1000 * 30

    // five minutes
    : 1000 * 60 * 5;


  let interval;

  events.once('wuffle.start', function() {

    interval = setInterval(dumpStore, DUMP_INTERVAL);

    return restoreStore();
  }, 1500);

  events.once('wuffle.pre-exit', function() {

    if (interval) {
      clearInterval(interval);
    }

    return dumpStore();
  });


  // api //////////////////

  this.restoreStore = restoreStore;
  this.dumpStore = dumpStore;

}

module.exports = DumpStoreLocal;