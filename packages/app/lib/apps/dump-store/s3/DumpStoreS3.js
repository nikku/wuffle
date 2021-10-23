const S3 = require('./S3');


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
function DumpStoreS3(logger, store, events) {

  const log = logger.child({
    name: 'wuffle:dump-store-s3'
  });

  const s3 = new S3();


  // impl

  async function dumpStore() {

    let start = Date.now();

    try {
      const dump = await store.asJSON();

      await s3.upload(dump);

      log.info({ ...s3.params, t: Date.now() - start }, 'dumped');
    } catch (err) {
      log.error({
        err,
        ...s3.params,
        t: Date.now() - start
      }, 'dump failed');
    }
  }

  async function restoreStore() {

    let start = Date.now();

    let dump;

    try {
      dump = await s3.download();
    } catch (err) {
      log.warn({ ...s3.params, t: Date.now() - start, err }, 'restore failed');

      return;
    }

    await store.loadJSON(dump);

    log.info({ ...s3.params, t: Date.now() - start }, 'restored');
  }


  // five minutes
  const DUMP_INTERVAL = 1000 * 60 * 5;

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

module.exports = DumpStoreS3;