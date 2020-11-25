const {
  filterIssueOrPull,
  filterRepository
} = require('../../filters');

const {
  issueIdent
} = require('../../util');

function isInternalError(error) {
  return 'status' in error && error.status === 500;
}


/**
 * This component performs a periodic background sync of a project.
 *
 * @param {import("../../types").Logger} logger
 * @param {Object} config
 * @param {import("../../store")} store
 * @param {import("../github-client/GithubClient")} githubClient
 * @param {import("../github-app/GithubApp")} githubApp
 * @param {import("../../events")} events
 */
function BackgroundSync(logger, config, store, githubClient, githubApp, events) {

  // 30 days
  const syncClosedLookback = (
    parseInt(process.env.BACKGROUND_SYNC_SYNC_CLOSED_LOOKBACK, 10) ||
    1000 * 60 * 60 * 24 * 30
  );

  // 4 hours
  const syncClosedDetailsLookback = (
    parseInt(process.env.BACKGROUND_SYNC_SYNC_CLOSED_DETAILS_LOOKBACK, 10) ||
    1000 * 60 * 60 * 4
  );

  // 1 day
  const syncOpenDetailsLookback = (
    parseInt(process.env.BACKGROUND_SYNC_SYNC_OPEN_DETAILS_LOOKBACK, 10) ||
    1000 * 60 * 60 * 24
  );

  // 60 days
  const removeClosedLookback = (
    parseInt(process.env.BACKGROUND_SYNC_REMOVE_CLOSED_LOOKBACK, 10) ||
    1000 * 60 * 60 * 24 * 60
  );

  const syncClosedDetails = process.env.BACKGROUND_SYNC_SYNC_CLOSED_DETAILS !== 'false';

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

  function shouldSyncDetails(issue, syncClosedSince, syncOpenSince) {

    const updated_at = new Date(issue.updated_at).getTime();

    if (issue.closed) {
      return updated_at > syncClosedSince;
    } else {
      return updated_at > syncOpenSince;
    }
  }

  function getSyncClosedSince() {
    return Date.now() - syncClosedLookback;
  }

  function getSyncClosedDetailsSince() {
    const lookback = syncClosedDetails ? syncClosedDetailsLookback : 0;

    return Date.now() - lookback;
  }

  function getSyncOpenDetailsSince() {
    return Date.now() - syncOpenDetailsLookback;
  }

  function getRemoveClosedBefore() {
    return Date.now() - removeClosedLookback;
  }

  async function fetchInstallationEntities(installation, syncClosedSince) {

    const foundIssues = {};

    const foundRepositories = {};

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

        // log found repository
        foundRepositories[repository.id] = filterRepository(repository);

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
            per_page: 100,
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
                since: new Date(syncClosedSince).toISOString()
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

                const filtered = pulls.filter(
                  pull => new Date(pull.updated_at).getTime() > syncClosedSince
                );

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
              log.error({
                [type]: `${owner}/${repo}#${issueOrPull.number}`
              }, 'sync failed', error);
            }
          }

          log.debug({
            repo: `${owner}/${repo}`
          }, 'processed');
        } catch (error) {
          log.error({
            repo: `${owner}/${repo}`
          }, 'processing failed', error);

          if (isInternalError(error)) {
            throw error;
          }
        }

      } // end --- for (const repository of repositories)

      log.debug({ installation: owner }, 'processed');
    } catch (error) {
      log.error({ installation: owner }, 'processing failed', error);

      if (isInternalError(error)) {
        throw error;
      }
    }

    return {
      issues: foundIssues,
      repositories: foundRepositories
    };
  }

  async function fetchEntities(installations, syncClosedSince) {

    let foundIssues = {};
    let foundRepositories = {};

    // sync issues
    for (const installation of installations) {

      const installationEntities = await fetchInstallationEntities(installation, syncClosedSince);

      foundIssues = {
        ...foundIssues,
        ...installationEntities.issues
      };

      foundRepositories = {
        ...foundRepositories,
        ...installationEntities.repositories
      };
    }

    return {
      issues: foundIssues,
      repositories: foundRepositories
    };
  }

  async function checkCleanup(issues, repositories, expiryTime) {

    let now = Date.now();

    let removedIssues = {};

    log.debug('cleanup start');

    for (const issue of issues) {

      const {
        id,
        key,
        updated_at
      } = issue;

      let expired = false;
      let removed = false;

      if (!repositories[issue.repository.id]) {
        log.debug({ issue: key }, 'cleanup -> repository removed');

        removed = true;
      }

      const updatedTime = new Date(updated_at).getTime();

      if (updatedTime < expiryTime) {
        log.debug({ issue: key }, 'cleanup -> issue expired', { updatedTime, expiryTime });

        expired = true;
      }

      if (!expired && !removed) {
        continue;
      }

      try {
        log.debug({ issue: key }, 'cleanup -> removing issue');
        await store.removeIssueById(id);

        removedIssues[id] = issue;
      } catch (err) {
        log.error({ issue: key }, 'cleanup failed', err);
      }
    }

    log.debug({ t: Date.now() - now }, 'cleanup done');

    return removedIssues;
  }

  async function doSync(installations) {

    const t = Date.now();

    // search existing issues

    const {
      issues: foundIssues,
      repositories: foundRepositories
    } = await fetchEntities(installations, getSyncClosedSince());

    log.debug(
      { t: Date.now() - t },
      'found %s issues in %s repositories',
      Object.keys(foundIssues).length,
      Object.keys(foundRepositories).length
    );

    const pendingUpdates = Object.values(foundIssues).filter(update => update);

    const t2 = Date.now();

    // update changed issues

    await Promise.all(pendingUpdates.map(update => store.updateIssue(update)));

    // emit background sync event for all found issues

    await syncDetails(
      Object.keys(foundIssues),
      getSyncClosedDetailsSince(),
      getSyncOpenDetailsSince()
    );

    log.debug(
      { t: Date.now() - t2 },
      'applied updates'
    );

    // check for all missing issues, these will
    // be automatically expired once they reach a
    // certain life-span without activity

    const allIssues = await store.getIssues();

    const knownIssues = allIssues.reduce((byId, issue) => {
      byId[issue.id] = issue;

      return byId;
    }, {});

    const missingIssues =
      Object.keys(knownIssues)
        .filter(k => !(k in foundIssues))
        .map(k => knownIssues[k]);

    const removedIssues = await checkCleanup(missingIssues, foundRepositories, getRemoveClosedBefore());

    log.info(
      { t: Date.now() - t },
      'updated %s, removed %s issues',
      pendingUpdates.length,
      Object.keys(removedIssues).length
    );
  }

  function syncDetails(issueIds, syncClosedSince, syncOpenSince) {

    const jobs = issueIds.map(async id => {
      const issue = await store.getIssueById(id);

      if (!issue) {
        return;
      }

      if (!shouldSyncDetails(issue, syncClosedSince, syncOpenSince)) {
        return;
      }

      return events.emit('backgroundSync.sync', {
        issue
      }).catch(err => {
        log.error({ issue: issueIdent(issue) }, 'details sync failed', err);
      });
    });

    return Promise.all(jobs);
  }

  async function backgroundSync() {

    log.info('start');

    try {
      const installations = await githubApp.getInstallations();

      await doSync(installations);

      log.info('done');
    } catch (error) {
      log.error('failed', error);
    }

  }

  const syncInterval = (
    parseInt(process.env.BACKGROUND_SYNC_SYNC_INTERVAL, 10) || (
      process.env.NODE_ENV === 'development'

        // one minute
        ? 1000 * 60

        // one hour
        : 1000 * 60 * 60
    )
  );

  // five seconds
  const checkInterval = 5000;

  async function checkSync() {

    const now = Date.now();

    const lastSync = store.lastSync;

    if (typeof lastSync === 'undefined' || now - lastSync > syncInterval) {

      store.lastSync = now;

      await backgroundSync();
    }

    checkTimeout = setTimeout(checkSync, checkInterval);
  }

  // api ///////////////////

  this.backgroundSync = backgroundSync;


  // life-cycle ////////////

  let checkTimeout;

  if (process.env.DISABLE_BACKGROUND_SYNC) {
    log.warn('periodic sync disabled via configuration');
    return;
  }

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