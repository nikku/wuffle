/**
 * This component performs a periodic background sync of a project.
 *
 * @param  {Application} app
 * @param  {Object} config
 * @param  {Store} store
 */
module.exports = async (app, config, store) => {

  const log = app.log.child({
    name: 'wuffle:background-sync'
  });

  const {
    repositories
  } = config;

  if (repositories.length === 0) {
    return log.error(
      'must declare <config.repositories> to let wuffle know which repositories should be synched in background'
    );
  }

  async function doSync(repositories) {

    for (const repositoryName of repositories) {
      const [ owner, repo ] = repositoryName.split('/');

      log.debug({ repositoryName }, 'syncing');

      try {
        const github = await app.orgAuth(owner);

        const [
          issues,
          repository
        ] = await Promise.all([
          github.paginate(
            github.issues.listForRepo.endpoint.merge({
              owner,
              repo
            }),
            res => res.data
          ),
          github.repos.get({
            owner,
            repo
          }).then(res => res.data)
        ]);

        log.info({ repositoryName }, 'synched');

        store.updateIssues(issues.map(issue => {

          const type = 'pull_request' in issue
            ? 'pull-request'
            : 'issue';

          return {
            type,
            repository,
            ...issue
          };

        }));
      } catch (error) {
        log.warn({ repositoryName }, 'failed to synchronize', error);
      }

    }

  }

  async function backgroundSync() {

    log.info('synchronizing project');

    try {
      await doSync(repositories);
      log.info('synchronized project');
    } catch (error) {
      log.warn('project sync failed', error);
    }
  }

  // one hour
  const syncInterval = 60 * 60 * 1000;

  function checkSync() {

    const now = Date.now();

    const lastSync = store.lastSync;

    if (typeof lastSync === 'undefined' || now - lastSync > syncInterval) {
      store.lastSync = now;

      backgroundSync();
    }
  }

  // api ///////////////////

  app.backgroundSync = backgroundSync;


  // behavior ///////////////

  if (config.backgroundSync === false || process.env.NODE_ENV !== 'test') {

    // every hour
    setInterval(checkSync, 5000);
  }
};