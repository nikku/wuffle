const {
  filterIssueOrPull
} = require('../../filters');


/**
 * This component performs a periodic background sync of a project.
 *
 * @param {Logger} logger
 * @param {Object} config
 * @param {Store} store
 * @param {GitHubClient} githubClient
 * @param {GithubApp} githubApp
 * @param {WebhookEvents} webhookEvents
 * @param {Events} events
 */
function BackgroundSync(logger, config, store, githubClient, githubApp, events) {

  // 30 days
  const syncLookback = 1000 * 60 * 60 * 24 * 30;

  // 60 days
  const removalLookback = 1000 * 60 * 60 * 24 * 60;

  const log = logger.child({
    name: 'wuffle:background-sync'
  });


  if ('repositories' in config) {

    log.warn(`
Configuring repositories via wuffle.config.js got removed, please update your config.

We automatically synchronize all repositories you granted us access to via the GitHub app.
`
    );
  }


  function getSyncSince() {
    return Date.now() - syncLookback;
  }

  function getRemoveBefore() {
    return Date.now() - removalLookback;
  }

  async function fetchInstallationIssues(installation, since) {

    const foundIssues = {};

    const owner = installation.account.login;

    log.debug({ installation: owner }, 'processing');

    try {
      const github = await githubClient.getOrgScoped(owner);

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
          }, 'processing');

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

          for (const issueOrPull of [
            ...open_issues,
            ...closed_issues,
            ...open_pull_requests,
            ...closed_pull_requests
          ]) {

            const type = 'issue_url' in issueOrPull ? 'pull_request' : 'issue';

            try {

              const update = filterIssueOrPull(issueOrPull, repository);

              const {
                id
              } = update;

              const existingIssue = await store.getIssueById(id);

              events.emit('backgroundSync.sync', {
                existingIssue,
                update
              }).catch(err => {
                log.error('additional sync failed', err);
              });

              if (existingIssue && existingIssue.updated_at >= update.updated_at) {
                foundIssues[id] = null;

                log.debug({
                  [type]: `${owner}/${repo}#${issueOrPull.number}`
                }, 'skipping, as up-to-date');
              } else {
                foundIssues[id] = update;

                log.debug({
                  [type]: `${owner}/${repo}#${issueOrPull.number}`
                }, 'scheduled for update');
              }
            } catch (error) {
              log.warn({
                [type]: `${owner}/${repo}#${issueOrPull.number}`
              }, 'sync failed', error);
            }
          }

          log.debug({
            repo: `${owner}/${repo}`
          }, 'processed');
        } catch (error) {
          log.warn({
            repo: `${owner}/${repo}`
          }, 'processing failed', error);
        }

      } // end --- for (const repository of repositories)

      log.debug({ installation: owner }, 'processed');
    } catch (error) {
      log.warn({ installation: owner }, 'processing failed', error);
    }

    return foundIssues;
  }

  async function fetchUpdates(installations, since) {

    let foundIssues = {};

    // sync issues
    for (const installation of installations) {

      const installationIssues = await fetchInstallationIssues(installation, since);

      foundIssues = {
        ...foundIssues,
        ...installationIssues
      };
    }

    return foundIssues;
  }

  async function checkExpiration(issues, expiryTime) {

    let now = Date.now();

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

    log.debug({ t: Date.now() - now }, 'expiration check done');

    return expired;
  }

  async function doSync(installations) {

    const t = Date.now();

    // get issues, keyed by id
    const knownIssues = await store.getIssues().reduce((byId, issue) => {
      byId[issue.id] = issue;

      return byId;
    }, {});

    const t1 = Date.now();

    // synchronize existing issues
    const foundIssues = await fetchUpdates(installations, getSyncSince());

    log.debug(
      { t: Date.now() - t1 },
      'found %s issues',
      Object.keys(foundIssues).length
    );

    const pendingUpdates = Object.values(foundIssues).filter(update => update);

    const t2 = Date.now();

    // process updates
    await Promise.all(pendingUpdates.map(update => store.updateIssue(update)));

    log.debug(
      { t: Date.now() - t2 },
      'applied updates'
    );

    // check for all missing issues, these will
    // be automatically expired once they reach a
    // certain life-span without activity

    const missingIssues = Object.keys(knownIssues).filter(k => !(k in foundIssues)).map(k => knownIssues[k]);

    const expiredIssues = await checkExpiration(missingIssues, getRemoveBefore());

    log.info(
      { t: Date.now() - t },
      'updated %s, expired %s issues',
      pendingUpdates.length,
      Object.keys(expiredIssues).length
    );
  }

  async function backgroundSync() {

    log.info('start');

    try {

      const installations = await githubApp.getInstallations();

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

    checkTimeout = setTimeout(checkSync, checkInterval);
  }

  // api ///////////////////

  this.backgroundSync = backgroundSync;


  // life-cycle ////////////

  let checkTimeout;

  events.once('wuffle.start', function() {
    checkTimeout = setTimeout(checkSync, checkInterval);
  });

  events.once('wuffle.pre-exit', function() {
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }
  });

}

module.exports = BackgroundSync;