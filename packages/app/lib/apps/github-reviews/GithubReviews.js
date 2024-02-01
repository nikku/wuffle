import { repoAndOwner } from '../../util/index.js';
import { filterUser, filterPull } from '../../filters.js';


/**
 * This component updates the stored issues based on GitHub events.
 *
 * @constructor
 *
 * @param {import('../webhook-events/WebhookEvents.js').default} webhookEvents
 * @param {import('../../events.js').default} events
 * @param {import('../github-client/GithubClient.js').default} githubClient
 * @param {import('../../store.js').default} store
 */
export default function GithubReviews(webhookEvents, events, githubClient, store) {

  // issues /////////////////////

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

    const {
      repo,
      owner
    } = repoAndOwner(issue);

    const github = await githubClient.getOrgScoped(owner);

    const {
      data: reviews
    } = await github.pulls.listReviews({
      owner,
      repo,
      pull_number: issue.number
    });

    await store.queueUpdate({
      id,
      reviews: reviews.map(filterReview)
    });

  });

  webhookEvents.on([
    'pull_request_review'
  ], async ({ payload }) => {
    const {
      action,
      review: _review,
      pull_request: _pull_request,
      repository
    } = payload;

    const pull_request = filterPull(_pull_request, repository);
    const review = filterReview(_review);

    const {
      id
    } = pull_request;

    const issue = await store.getIssueById(id);

    let reviews = (issue && issue.reviews) || [];

    if (action === 'submitted') {
      reviews = [
        ...reviews,
        review
      ];
    }

    if (action === 'edited' || action === 'dismissed') {

      const index = reviews.findIndex(r => r.id === review.id);

      if (index !== -1) {
        reviews = [
          ...reviews.slice(0, index),
          review,
          ...reviews.slice(index + 1)
        ];
      } else {
        reviews = [
          ...reviews,
          review
        ];
      }
    }

    await store.updateIssue({
      ...pull_request,
      reviews
    });
  });

}


function filterReview(review) {

  const {
    id,
    node_id,
    body,
    commit_id,
    submitted_at,
    state,
    user,
    html_url
  } = review;

  return {
    id,
    node_id,
    body,
    commit_id,
    submitted_at,
    state: state.toLowerCase(),
    user: filterUser(user),
    html_url
  };
}