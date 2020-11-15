const {
  repoAndOwner,
  Cache
} = require('../../util');

const {
  filterPull
} = require('../../filters');


/**
 * This component updates synchronizes GitHub statuses with pull requests.
 *
 * @param {import('../webhook-events/WebhookEvents')} webhookEvents
 * @param {import('../../events')} events
 * @param {import('../github-client/GithubClient')} githubClient
 * @param {import('../../store')} store
 */
module.exports = function GithubStates(webhookEvents, events, githubClient, store) {

  // issues /////////////////////

  // one day
  const CACHE_TTL = process.env.NODE_ENV === 'development'
    ? 1000 * 15
    : 1000 * 60 * 60 * 24;

  const cache = new Cache(CACHE_TTL);


  async function fetchStatuses(pullRequest) {

    const {
      head,
      repository
    } = pullRequest;

    const {
      sha
    } = head;

    const statuses = await cache.get(`${repository.id}/${sha}`, async () => {

      const {
        repo,
        owner
      } = repoAndOwner(pullRequest);

      const github = await githubClient.getOrgScoped(owner);

      const {
        data: response
      } = await github.repos.getCombinedStatusForRef({
        owner,
        repo,
        ref: sha
      });

      return response.statuses.map(filterStatus).map(status => {
        return {
          ...status,
          sha
        };
      });
    });

    return statuses;
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

    const statuses = await fetchStatuses(issue);

    await store.queueUpdate({
      id,
      statuses
    });

  });

  webhookEvents.on([
    'pull_request.opened',
    'pull_request.synchronize'
  ], async ({ payload }) => {

    const {
      pull_request: _pull_request,
      repository
    } = payload;

    const pull_request = filterPull(_pull_request, repository);

    const {
      id
    } = pull_request;

    const statuses = await fetchStatuses(pull_request);

    await store.updateIssue({
      id,
      statuses
    });
  });

  webhookEvents.on([
    'status'
  ], async ({ payload }) => {
    const status = filterStatus(payload);

    const {
      repository: status_repository
    } = payload;

    // invalidate cached statuses
    await cache.remove(`${status_repository.id}/${status.sha}`);

    await store.updateIssues(issue => {

      const {
        head,
        repository,
        statuses
      } = issue;

      if (!head) {
        return;
      }

      if (repository.id === status_repository.id && status.sha === head.sha) {

        return {
          statuses: addOrUpdate(statuses || [], status)
        };
      }
    });
  });

  // periodically clear cache
  setInterval(() => {
    cache.evict();
  }, 1000 * 60);

};


function filterStatus(status) {

  const {
    id,
    node_id,
    context,
    description,
    sha,
    state,
    target_url,
    created_at,
    updated_at
  } = status;

  return {
    id,
    node_id,
    context,
    description,
    sha,
    state,
    target_url,
    created_at,
    updated_at
  };
}


function addOrUpdate(statuses, status) {
  const index = statuses.findIndex(s => s.context === status.context);

  return index !== -1
    ? [
      ...statuses.slice(0, index),
      status,
      ...statuses.slice(index + 1)
    ]
    : [
      ...statuses,
      status
    ];
}