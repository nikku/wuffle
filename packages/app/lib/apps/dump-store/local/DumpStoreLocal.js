const fs = require('fs').promises;
const path = require('path');

const { mkdirp } = require('mkdirp');


/**
 * This component restores a store dump on startup and periodically
 * persists the store to disc.
 *
 * @constructor
 *
 * @param {import('../../../types').Logger} logger
 * @param {import('../../../store')} store
 * @param {import('../../../events')} events
 */
function DumpStoreLocal(logger, store, events) {

  const log = logger.child({
    name: 'wuffle:dump-store-local'
  });

  const storeLocation = 'tmp/storedump.json';

  const params = { storeLocation };


  // io helpers

  function upload(dump) {
    return mkdirp(path.dirname(storeLocation)).then(
      () => fs.writeFile(storeLocation, dump, 'utf8')
    );
  }

  function download() {
    return fs.readFile(storeLocation, 'utf8');
  }


  // impl

  async function dumpStore() {

    let start = Date.now();

    try {
      const dump = await store.asJSON();

      await upload(dump);

      log.info({ ...params, t: Date.now() - start }, 'dumped');
    } catch (err) {
      log.error({
        err,
        ...params,
        t: Date.now() - start
      }, 'dump failed');
    }
  }

  async function restoreStore() {

    let start = Date.now();

    let dump;

    try {
      dump = await download();
    } catch (err) {
      log.warn({ ...params, t: Date.now() - start, err }, 'restore failed');

      return;
    }

    await store.loadJSON(dump);

    log.info({ ...params, t: Date.now() - start }, 'restored');
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