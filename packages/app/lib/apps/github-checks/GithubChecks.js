const {
  repoAndOwner,
  Cache
} = require('../../util');

/**
 * This component updates the stored issues based on GitHub events.
 *
 * @param {import("../webhook-events/WebhookEvents")} webhookEvents
 * @param {import("../../events")} events
 * @param {import("../github-client/GithubClient")} githubClient
 * @param {import("../../store")} store
 */
module.exports = function GithubChecks(webhookEvents, events, githubClient, store) {

  // issues /////////////////////

  // one day
  const CACHE_TTL = process.env.NODE_ENV === 'development'
    ? 1000 * 15
    : 1000 * 60 * 60 * 24;

  const cache = new Cache(CACHE_TTL);


  async function fetchCheckRuns(pullRequest) {

    const {
      head,
      repository
    } = pullRequest;

    const {
      sha
    } = head;

    const runs = await cache.get(`${repository.id}/${sha}`, async () => {

      const {
        repo,
        owner
      } = repoAndOwner(pullRequest);

      const github = await githubClient.getOrgScoped(owner);

      const {
        data: result
      } = await github.checks.listForRef({
        owner,
        repo,
        ref: sha,
        filter: 'latest'
      });

      return result.check_runs.map(filterCheckRun);
    });

    return runs;
  }

  events.on('backgroundSync.sync', async (event) => {

    const {
      issue
    } = event;

    if (!issue.pull_request) {
      return;
    }

    const {
      id
    } = issue;

    const checkRuns = await fetchCheckRuns(issue);

    await store.queueUpdate({
      id,
      check_runs: checkRuns
    });

  });

  webhookEvents.on([
    'check_run'
  ], async ({ payload }) => {
    const {
      check_run: _check_run,
      repository
    } = payload;

    const check_run = filterCheckRun(_check_run);

    // invalidate cached PR checks
    cache.remove(`${repository.id}/${check_run.head_sha}`);

    const issueIds = _check_run.pull_requests.map(pr => `${ pr.base.repo.id }-${pr.number}`);

    await store.updateIssues(issue => {

      if (issueIds.indexOf(issue.id) !== -1) {

        return {
          check_runs: addOrUpdate(issue.check_runs || [], check_run)
        };
      }
    });
  });

  // periodically clear cache
  setInterval(() => {
    cache.evict();
  }, 1000 * 60);

};


function filterCheckRun(check_suite) {

  const {
    id,
    node_id,
    conclusion,
    head_sha,
    html_url,
    name,
    status
  } = check_suite;

  return {
    id,
    node_id,
    conclusion,
    head_sha,
    html_url,
    name,
    status
  };
}

function addOrUpdate(check_runs, check_run) {
  const index = check_runs.findIndex(run => run.name === check_run.name);

  return index !== -1
    ? [
      ...check_runs.slice(0, index),
      check_run,
      ...check_runs.slice(index + 1)
    ]
    : [
      ...check_runs,
      check_run
    ];
}