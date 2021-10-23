const {
  version
} = require('../../package.json');


/**
 * @constructor
 *
 * @param {any} logger
 * @param {any} config
 * @param {any} events
 * @param {any} store
 */
function ReindexStore(logger, config, events, store) {

  const log = logger.child({
    name: 'wuffle:reindex-store'
  });

  function getConfigHash() {
    return hash(JSON.stringify(config));
  }

  const configHash = getConfigHash();

  async function reindexStore() {

    const t = Date.now();

    // update all issues, recomputing order and column names
    await store.updateIssues(issue => {
      return {};
    });

    log.info({ t: Date.now() - t }, 'reindexed store');
  }

  events.on('store.restored', async event => {

    const {
      data
    } = event;

    if (configHash !== data.configHash) {
      log.info('config changed');

      await reindexStore();
    }
  });

  events.on('store.serialize', async event => {

    const {
      data
    } = event;

    data.configHash = configHash;
    data.wuffleVersion = version;
  });

}

module.exports = ReindexStore;


// helpers //////////////////

function hash(str) {
  const crypto = require('crypto');

  return crypto.createHash('md5').update(str).digest('hex');
}