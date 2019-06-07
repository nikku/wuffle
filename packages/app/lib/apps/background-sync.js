const {
  filterIssue,
  filterPull
} = require('../filters');


/**
 * This component performs a periodic background sync of a project.
 *
 * @param  {Application} app
 * @param  {Object} config
 * @param  {Store} store
 */
module.exports = async (app, config, store) => {

  // 30 days
  const syncLookback = 1000 * 60 * 60 * 24 * 30;

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

  function fetchRepository(repositoryName) {

    const [ owner, repo ] = repositoryName.split('/');

    return app.orgAuth(owner).then(github => {
      return github.repos.get({
        owner,
        repo
      });
    }).then(res => res.data);
  }

  async function syncRepositories(repositories, since) {

    const foundIssues = {};

    // sync issues
    for (const repositoryName of repositories) {
      const [ owner, repo ] = repositoryName.split('/');

      const params = {
        sort: 'updated',
        direction: 'desc',
        owner,
        repo
      };

      log.debug({ repositoryName }, 'issues sync start');

      try {
        const github = await app.orgAuth(owner);

        const [
          open_issues,
          closed_issues,
          open_pull_requests,
          closed_pull_requests,
          repository
        ] = await Promise.all([

          // open issues
          github.paginate(
            github.issues.listForRepo.endpoint.merge({
              ...params,
              state: 'open'
            }),
            (response) => response.data.filter(issue => !issue.pull_request)
          ),

          // closed issues, updated last 30 days
          github.paginate(
            github.issues.listForRepo.endpoint.merge({
              ...params,
              state: 'closed',
              since: new Date(since).toISOString()
            }),
            (response) => response.data.filter(issue => !issue.pull_request)
          ),

          // open pulls
          github.paginate(
            github.pulls.list.endpoint.merge({
              ...params,
              state: 'open'
            }),
            (response) => response.data
          ),

          // closed pulls, updated last 30 days
          github.paginate(
            github.pulls.list.endpoint.merge({
              ...params,
              state: 'closed'
            }),
            (response, done) => {

              const pulls = response.data;

              const filtered = pulls.filter(pull => new Date(pull.updated_at).getTime() > since);

              if (filtered.length !== pulls.length) {
                done();
              }

              return filtered;
            }
          ),

          // repository information
          fetchRepository(repositoryName)
        ]);

        for (const issue of [ ...open_issues, ...closed_issues ]) {

          const update = filterIssue(issue, repository);

          try {
            await store.updateIssue(update);
          } catch (error) {
            log.error({ issue: update.key }, 'update failed', error);
          }

          // mark as found
          foundIssues[update.id] = update;
        }

        for (const pull_request of [ ...open_pull_requests, ...closed_pull_requests ]) {

          const update = filterPull(pull_request, repository);

          try {
            await store.updateIssue(update);
          } catch (error) {
            log.error({ issue: update.key }, 'update failed', error);
          }

          // mark as found
          foundIssues[update.id] = true;
        }

        log.debug({ repositoryName }, 'issues sync completed');
      } catch (error) {
        log.warn({ repositoryName }, 'issues sync failed', error);
      }
    }

    return foundIssues;
  }

  async function doSync(repositories) {

    // synchronize existing issues
    const foundIssues = await syncRepositories(repositories, Date.now() - syncLookback);

    log.info(
      'synched %s issues',
      Object.keys(foundIssues).length
    );
  }

  async function backgroundSync() {

    log.info('project sync start');

    try {
      await doSync(repositories);
      log.info('project sync completed');
    } catch (error) {
      log.warn('project sync failed', error);
    }
  }

  const syncInterval = (
    process.env.NODE_ENV === 'development'
      // one minute
      ? 1000 * 60
      // one hour
      : 1000 * 60 * 60
  );

  // five seconds
  const checkInterval = 5000;


  async function checkSync() {

    const now = Date.now();

    const lastSync = store.lastSync;

    if (typeof lastSync === 'undefined' || now - lastSync > syncInterval) {

      await backgroundSync();

      store.lastSync = now;
    }

    setTimeout(checkSync, checkInterval);
  }

  // api ///////////////////

  app.backgroundSync = backgroundSync;


  // behavior ///////////////

  if (config.backgroundSync !== false && process.env.NODE_ENV !== 'test') {

    // start synchronization check
    setTimeout(checkSync, checkInterval);
  }

};