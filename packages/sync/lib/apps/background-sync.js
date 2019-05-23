const {
  repoAndOwner,
  Cache
} = require('../util');

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


  function applyUpdate(issue, repository) {

    const type = 'pull_request' in issue
      ? 'pull-request'
      : 'issue';

    store.updateIssue({
      type,
      repository,
      ...issue
    });

  }

  async function doSync(repositories) {

    const repoCache = new Cache(-1);

    // get issues, keyed by id
    const knownIssues = store.getIssues().reduce((byId, issue) => {
      byId[issue.id] = issue;

      return byId;
    }, {});

    const foundIssues = {};

    // sync open issues
    for (const repositoryName of repositories) {
      const [ owner, repo ] = repositoryName.split('/');

      log.debug({ repositoryName }, 'syncing open issues');

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

        issues.forEach(issue => {

          // update in store
          applyUpdate(issue, repository);

          // mark as found
          foundIssues[issue.id] = issue;
        });


        log.info({ repositoryName }, 'synched open issues');
      } catch (error) {
        log.warn({ repositoryName }, 'failed to synchronize open issues', error);
      }

    }

    // check for all known but not-yet synched issues,
    // those are either deleted or already closed
    // and we must manually retrieve them and update them

    const closedIssues = Object.keys(knownIssues).filter(k => !(k in foundIssues)).map(k => knownIssues[k]);

    for (const closedIssue of closedIssues) {

      const { number: issue_number } = closedIssue;

      const { repo, owner } = repoAndOwner(closedIssue);

      const issueParams = { repo, owner, issue_number };

      const issueContext = { issue: issueIdent(issueParams) };

      log.info(issueContext, 'syncing issue');

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

        // update in store
        applyUpdate(issue, repository);

        log.info(issueContext, 'synched issue');

      } catch (error) {

        log.warn(issueContext, 'failed to synchronize issue', error);

        false && store.removeIssue(closedIssue);
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


function issueIdent({ repo, owner, issue_number }) {
  return `${owner}/${repo}#${issue_number}`;
}