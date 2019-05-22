const {
  repoAndOwner,
  Cache
} = require('../util');

const TTL = 10000;

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

  function fetchRepository(repositoryName) {

    const [ owner, repo ] = repositoryName.split('/');

    return app.orgAuth(owner).then(github => {
      return github.repos.get({
        owner,
        repo
      });
    }).then(res => res.data);
  }

  async function doSync(repositories) {

    const repoCache = new Cache(TTL);

    // get issues, keyed by id
    const knownIssues = store.getIssues().reduce((byId, issue) => {
      byId[issue.id] = issue;

      return byId;
    }, {});

    const foundIssues = {};

    // sync open issues
    for (const repositoryName of repositories) {
      const [ owner, repo ] = repositoryName.split('/');

      log.debug({ repositoryName }, 'syncing repository');

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
          repoCache.get(repositoryName, fetchRepository)
        ]);

        // update issues in store
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

        // mark all issues as found
        issues.forEach(issue => foundIssues[issue.id] = issue);

        log.info({ repositoryName }, 'synched repository');
      } catch (error) {
        log.warn({ repositoryName }, 'failed to synchronize repository', error);
      }

    }

    // check for all known but not-yet synched issues,
    // those are either deleted or already closed
    // and we must manually retrieve them and update them

    const openIssues = Object.keys(knownIssues).filter(k => !(k in foundIssues)).map(k => knownIssues[k]);

    for (const openIssue of openIssues) {

      const { number: issue_number } = openIssue;

      const { repo, owner } = repoAndOwner(openIssue);

      const issueParams = { repo, owner, issue_number };

      log.info(issueParams, 'syncing issue');

      try {
        const github = await app.orgAuth(owner);

        const [
          issue,
          repository
        ] = await Promise.all([
          github.issues.get({
            owner,
            repo,
            issue_number
          }).then(res => res.data),
          repoCache.get(`${owner}/${repo}`, fetchRepository)
        ]);

        const type = 'pull_request' in issue
          ? 'pull-request'
          : 'issue';

        store.updateIssue({
          type,
          repository,
          ...issue
        });

        log.info(issueParams, 'synched issue');
      } catch (error) {

        log.warn(issueParams, 'failed to synchronize issue', error);

        false && store.removeIssue(openIssue);
      }
    }
  }

  async function backgroundSync() {

    log.info('syncing project');

    try {
      await doSync(repositories);
      log.info('synched project');
    } catch (error) {
      log.warn('failed to sync project', error);
    }
  }

  // one hour
  const syncInterval = 60 * 60 * 1000;

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

  if (config.backgroundSync === false || process.env.NODE_ENV !== 'test') {

    // start synchronization check
    setTimeout(checkSync, checkInterval);
  }
};