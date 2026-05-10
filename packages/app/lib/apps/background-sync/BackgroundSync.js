import { filterIssueOrPull, filterRepository } from '../../filters.js';
import { issueIdent } from '../../util/index.js';

function isInternalError(error) {
  return 'status' in error && error.status === 500;
}


/**
 * This component performs a periodic background sync of a project.
 *
 * Unless disabled via `process.env.DISABLE_BACKGROUND_SYNC` it will
 * register a recurring check.
 *
 * Background check performs various optimizations to ensure only relevant
 * data is stored on the board:
 *
 *   * Closed issues/PRs on the board will be thrashed
 *   * Closed issues/PRs wiil not be synchronized from GitHub
 *   * Open but stale issues/PRs will not be synchronized to the board
 *   * Open issue/PR details will only be synchronized for recent issues
 *
 * @constructor
 *
 * @param {Object} config
 * @param {import('../../types.js').Logger} logger
 * @param {import('../../store.js').default} store
 * @param {import('../../events.js').default} events
 * @param {import('./BackgroundSyncBackend.js').default} backgroundSyncBackend
 */
export default function BackgroundSync(config, logger, store, events, backgroundSyncBackend) {

  // 30 days
  const syncClosedLookback = (
    parseInt(process.env.BACKGROUND_SYNC_SYNC_CLOSED_LOOKBACK || '', 10) ||
    1000 * 60 * 60 * 24 * 30
  );

  // 4 hours
  const syncClosedDetailsLookback = (
    parseInt(process.env.BACKGROUND_SYNC_SYNC_CLOSED_DETAILS_LOOKBACK || '', 10) ||
    1000 * 60 * 60 * 4
  );

  // 1 day
  const syncOpenDetailsLookback = (
    parseInt(process.env.BACKGROUND_SYNC_SYNC_OPEN_DETAILS_LOOKBACK || '', 10) ||
    1000 * 60 * 60 * 24
  );

  // 60 days
  const removeClosedLookback = (
    parseInt(process.env.BACKGROUND_SYNC_REMOVE_CLOSED_LOOKBACK || '', 10) ||
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
      const repositories = await backgroundSyncBackend.getInstallationRepositories(installation);

      for (const repository of repositories) {

        if (repository.owner.login !== owner) {
          throw new Error('repository.owner !== installation.owner');
        }

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

          const {
            open_issues,
            closed_issues,
            open_pull_requests,
            closed_pull_requests
          } = await backgroundSyncBackend.getRepositoryIssuesAndPulls(repository, syncClosedSince);

          for (const issueOrPull of [
            ...open_issues,
            ...closed_issues,
            ...open_pull_requests,
            ...closed_pull_requests
          ]) {

            const type = 'issue_url' in issueOrPull ? 'pull_request' : 'issue';

            try {

              const update = filterIssueOrPull(issueOrPull, repository);

              foundIssues[update.id] = update;

              log.debug({
                [type]: `${owner}/${repo}#${issueOrPull.number}`
              }, 'scheduled for update');
            } catch (err) {
              log.error({
                err,
                [type]: `${owner}/${repo}#${issueOrPull.number}`
              }, 'synching failed');
            }
          }

          log.debug({
            repo: `${owner}/${repo}`
          }, 'processed');
        } catch (err) {
          log.error({
            err,
            repo: `${owner}/${repo}`
          }, 'processing failed');

          if (isInternalError(err)) {
            throw err;
          }
        }

      } // end --- for (const repository of repositories)

      log.debug({ installation: owner }, 'processed');
    } catch (err) {
      log.error({
        err,
        installation: owner
      }, 'processing failed');

      if (isInternalError(err)) {
        throw err;
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

      // if an open issue or pull request links to
      // a non-existing repository, then it must have been
      // removed
      if (!repositories[issue.repository.id]) {
        log.debug({ issue: key }, 'cleanup -> repository removed');

        removed = true;
      }

      // if an open pull request was not found (we always
      // fetch all), then it must have been deleted
      if (issue.pull_request && issue.state === 'open') {
        log.debug({ issue: key }, 'cleanup -> pull request deleted');

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
        log.error({
          err,
          issue: key
        }, 'cleaning up failed');
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

    const updateTasks = pendingUpdates.map(
      update => store.updateIssue(update)
    );

    // returns the update for updated issues or undefined
    // where issues were not stored (filtered out) - we only filter
    // for actual updated issues
    const updatedIssues = await Promise.all(updateTasks).then(updates => {
      return updates.filter(update => update);
    });

    // emit background sync event for all updated issues

    await syncDetails(
      updatedIssues,
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

  function syncDetails(updatedIssues, syncClosedSince, syncOpenSince) {

    const jobs = updatedIssues.map(async updatedIssue => {

      // ensure we fetch latest version of issue (to prevent de-sync)
      const issue = await store.getIssueById(updatedIssue.id);

      if (!issue) {
        return;
      }

      if (!shouldSyncDetails(issue, syncClosedSince, syncOpenSince)) {
        return;
      }

      return events.emit('backgroundSync.sync', {
        issue
      }).catch(err => {
        log.error({
          err,
          issue: issueIdent(issue)
        }, 'sync details failed');
      });
    });

    return Promise.all(jobs);
  }

  /**
   * Trigger background synchronization for all connected repositories.
   *
   * This ensures that data out-of-sync with the board is fetched from remote.
   *
   * @return {Promise<void>}
   */
  async function backgroundSync() {

    log.info('start');

    try {
      const installations = await backgroundSyncBackend.getInstallations();

      await doSync(installations);

      log.info('done');
    } catch (err) {
      log.error(err, 'failed');
    }

  }

  const syncInterval = (
    parseInt(process.env.BACKGROUND_SYNC_SYNC_INTERVAL || '', 10) || (
      process.env.NODE_ENV !== 'production'

        // five minutes
        ? 1000 * 5 * 60

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

  /**
   * Trigger background synchronization for all connected repositories.
   *
   * This ensures that data out-of-sync with the board is fetched from remote.
   *
   * @return {Promise<void>}
   */
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