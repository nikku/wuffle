const exitHook = require('exit-hook2');

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
          resolve(data.Data);
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
    });

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


  // dump every hour
  const dumpInterval = 1000 * 60 * 60;

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