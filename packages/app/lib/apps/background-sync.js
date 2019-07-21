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

  // 60 days
  const removalLookback = 1000 * 60 * 60 * 24 * 60;

  const log = app.log.child({
    name: 'wuffle:background-sync'
  });


  if ('repositories' in config) {

    log.warn(`
Configuring repositories via wuffle.config.js got removed, please update your config.

We automatically synchronize all repositories you granted us access to via the GitHub app.
`
    );
  }


  async function applyUpdate(update) {

    const {
      id,
      key
    } = update;

    const existing = store.getIssueById(id);

    if (!existing || existing.updated_at !== update.updated_at) {
      try {
        await store.updateIssue(update);
      } catch (error) {
        log.error({ issue: key }, 'update failed', error);
      }
    }

    return { id };
  }

  function syncPull(pull_request, repository) {
    return applyUpdate(filterPull(pull_request, repository));
  }

  function syncIssue(issue, repository) {
    return applyUpdate(filterIssue(issue, repository));
  }

  async function syncInstallation(installation, since) {

    const foundIssues = {};

    const owner = installation.account.login;

    log.debug({ installation: owner }, 'sync start');

    try {
      const github = await app.orgAuth(owner);

      const repositories = await github.paginate(
        github.apps.listRepos.endpoint.merge({ per_page: 100 }),
        (response) => response.data
      );

      for (const repository of repositories) {

        const owner = repository.owner.login;
        const repo = repository.name;

        // we ignore archived repositories
        if (repository.archived) {
          log.debug({
            owner,
            repo
          }, 'archived, ignoring');

          continue;
        }

        try {

          log.debug({
            owner,
            repo
          }, 'sync start');

          const params = {
            sort: 'updated',
            direction: 'desc',
            owner,
            repo
          };

          const [
            open_issues,
            closed_issues,
            open_pull_requests,
            closed_pull_requests
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
            )
          ]);

          for (const issue of [ ...open_issues, ...closed_issues ]) {

            try {
              const {
                id
              } = await syncIssue(issue, repository);

              // mark as found
              foundIssues[id] = true;
            } catch (error) {
              log.debug({
                owner,
                repo,
                issue: issue.number
              }, 'sync failed', error);
            }
          }

          for (const pull_request of [ ...open_pull_requests, ...closed_pull_requests ]) {

            try {
              const {
                id
              } = await syncPull(pull_request, repository);

              // mark as found
              foundIssues[id] = true;
            } catch (error) {
              log.debug({
                owner,
                repo,
                pr: pull_request.number
              }, 'sync failed', error);
            }
          }

          log.debug({
            owner,
            repo
          }, 'sync completed');
        } catch (error) {
          log.warn({
            owner,
            repo
          }, 'sync failed', error);
        }

      } // end --- for (const repository of repositories)

      log.debug({ installation: owner }, 'sync completed');
    } catch (error) {
      log.warn({ installation: owner }, 'sync failed', error);
    }

    return foundIssues;
  }

  async function syncInstallations(installations, since) {

    let foundIssues = {};

    // sync issues
    for (const installation of installations) {

      const installationIssues = await syncInstallation(installation, since);

      foundIssues = {
        ...foundIssues,
        ...installationIssues
      };
    }

    return foundIssues;
  }

  async function checkExpiration(issues, expiryTime) {

    let expired = {};

    log.debug('expiration check start');

    for (const issue of issues) {

      const {
        id,
        key,
        updated_at
      } = issue;

      const updatedTime = new Date(updated_at).getTime();

      if (updatedTime < expiryTime) {

        try {
          log.debug({ issue: key }, 'cleaning up');

          await store.removeIssueById(id);

          expired[id] = issue;
        } catch (err) {
          log.error({ issue: key }, 'cleanup failed', err);
        }
      }
    }

    log.debug('expiration check start');

    return expired;
  }

  async function doSync(installations) {

    const now = Date.now();

    // get issues, keyed by id
    const knownIssues = store.getIssues().reduce((byId, issue) => {
      byId[issue.id] = issue;

      return byId;
    }, {});

    // synchronize existing issues
    const foundIssues = await syncInstallations(installations, Date.now() - syncLookback);

    // check for all missing issues, these will
    // be automatically expired once they reach a
    // certain life-span without activity

    const missingIssues = Object.keys(knownIssues).filter(k => !(k in foundIssues)).map(k => knownIssues[k]);

    const expiredIssues = await checkExpiration(missingIssues, Date.now() - removalLookback);

    log.info(
      { t: Date.now() - now },
      'synched %s, expired %s issues',
      Object.keys(foundIssues).length,
      Object.keys(expiredIssues).length
    );
  }

  async function backgroundSync() {

    log.info('start');

    try {

      const installations = await app.getInstallations();

      await doSync(installations);

      log.info('success');
    } catch (error) {
      log.warn('error', error);
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