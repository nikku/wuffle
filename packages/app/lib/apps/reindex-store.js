import {
  getPackageVersion,
  hash
} from '../util/index.js';


/**
 * @constructor
 *
 * @param {any} config
 * @param {import('../types.js').Logger} logger
 * @param {import('../events.js').default} events
 * @param {import('../store.js').default} store
 */
export default function ReindexStore(config, logger, events, store) {

  const version = getPackageVersion();

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