const {
  repoAndOwner
} = require('../../util');

const {
  filterUser,
  filterPull
} = require('../../filters');


/**
 * This component updates the stored issues based on GitHub events.
 *
 * @param {WebhookEvents} webhookEvents
 * @param {Events} events
 * @param {GithubClient} githubClient
 * @param {Store} store
 */
module.exports = function Reviews(webhookEvents, events, githubClient, store) {

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

    await store.updateIssue({
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

    if (action === 'edited') {

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

    if (action === 'dismissed') {
      reviews = reviews.filter(r => r.id !== review.id);
    }

    await store.updateIssue({
      ...pull_request,
      reviews
    });
  });

};


function filterReview(review) {

  const {
    id,
    body,
    commit_id,
    submitted_at,
    state,
    user
  } = review;

  return {
    id,
    body,
    commit_id,
    submitted_at,
    state: state.toLowerCase(),
    user: filterUser(user)
  };
}