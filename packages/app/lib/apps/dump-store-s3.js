const { preExit } = require('../util');

const S3 = require('aws-sdk/clients/s3');

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

  function dumpStore() {

    let start = Date.now();

    return upload(store.asJSON()).then(() => {
      log.info({ ...params, t: Date.now() - start }, 'dumped');
    }).catch(err => {
      log.error({ ...params, t: Date.now() - start }, 'dump failed', err);
    });
  }

  function restoreStore() {

    let start = Date.now();

    return download().then(dump => {

      store.loadJSON(dump);

      log.info({ ...params, t: Date.now() - start }, 'restored');
    }).catch(err => {
      log.warn({ ...params, t: Date.now() - start }, 'restore failed', err);
    });
  }


  // dump every five minutes
  const dumpInterval = 1000 * 60 * 5;

  setInterval(dumpStore, dumpInterval);

  // dump on exit
  preExit(function() {
    log.info('pre-exit dump');

    return dumpStore();
  });

  // restore, initally
  return restoreStore();
};