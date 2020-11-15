const S3 = require('aws-sdk/clients/s3');


/**
 * This component restores a store dump on startup and periodically
 * persists the store to disc.
 *
 * @param  {import("../../../types").Logger} logger
 * @param  {import("../../../store")} store
 * @param  {import("../../../events")} events
 */
function DumpStoreS3(logger, store, events) {

  const log = logger.child({
    name: 'wuffle:dump-store-s3'
  });

  const {
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
    S3_BUCKET: bucket
  } = process.env;

  const s3 = new S3({
    accessKeyId,
    secretAccessKey
  });

  var params = {
    Bucket: bucket,
    Key: 'storedump.json'
  };


  // io helpers

  function upload(dump) {

    return new Promise((resolve, reject) => {

      const opts = {
        ...params,
        Body: dump
      };

      s3.putObject(opts, (err, data) => {

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  function download() {

    return new Promise((resolve, reject) => {

      s3.getObject(params, (err, data) => {

        if (err) {
          reject(err);
        } else {
          resolve(data.Body.toString('utf8'));
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