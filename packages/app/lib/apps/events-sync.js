const {
  filterIssue,
  filterPull,
  filterIssueOrPull,
  getIdentifier,
  filterStatus
} = require('../filters');


/**
 * This component updates the stored issues based on GitHub events.
 *
 * @param {WebhookEvents} webhookEvents
 * @param {Store} store
 */
module.exports = function(webhookEvents, store) {

  // issues /////////////////////

  webhookEvents.on([
    'issues.opened',
    'issues.reopened'
  ], async ({ payload }) => {
    const {
      issue,
      repository
    } = payload;

    return store.updateIssue(filterIssue(issue, repository));
  });

  webhookEvents.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issues.edited',
    'issues.closed'
  ], async ({ payload }) => {
    const {
      issue,
      repository
    } = payload;

    return store.updateIssue(filterIssue(issue, repository));
  });

  // available for issues only, we must manually
  // fetch the related pull request
  webhookEvents.on([
    'issues.milestoned',
    'issues.demilestoned',
  ], async ({ payload }) => {

    const {
      issue,
      repository
    } = payload;

    return store.updateIssue(filterIssueOrPull(issue, repository));
  });

  webhookEvents.on([
    'issues.deleted'
  ], async ({ payload }) => {

    const {
      issue,
      repository
    } = payload;

    const id = getIdentifier(issue, repository);

    return store.removeIssueById(id);
  });

  // pull requests //////////////////

  webhookEvents.on([
    'pull_request.opened',
    'pull_request.reopened'
  ], async ({ payload }) => {
    const {
      pull_request,
      repository
    } = payload;

    return store.updateIssue(filterPull(pull_request, repository));
  });

  webhookEvents.on([
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.edited',
    'pull_request.ready_for_review',
    'pull_request.assigned',
    'pull_request.unassigned',
    'pull_request.closed',
    'pull_request.review_requested',
    'pull_request.review_request_removed'
  ], async ({ payload }) => {
    const {
      pull_request,
      repository
    } = payload;

    return store.updateIssue(filterPull(pull_request, repository));
  });


  webhookEvents.on([
    'status'
  ], async ({ payload }) => {

    return store.updateStatus(filterStatus(payload));

  });

};