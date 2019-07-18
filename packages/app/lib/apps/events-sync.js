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
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  // issues /////////////////////

  app.onActive([
    'issues.opened',
    'issues.reopened'
  ], async ({ payload }) => {
    const {
      issue,
      repository
    } = payload;

    return store.updateIssue(filterIssue(issue, repository));
  });

  app.onActive([
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
  app.onActive([
    'issues.milestoned',
    'issues.demilestoned',
  ], async ({ payload }) => {

    const {
      issue,
      repository
    } = payload;

    return store.updateIssue(filterIssueOrPull(issue, repository));
  });

  app.onActive([
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

  app.onActive([
    'pull_request.opened',
    'pull_request.reopened'
  ], async ({ payload }) => {
    const {
      pull_request,
      repository
    } = payload;

    return store.updateIssue(filterPull(pull_request, repository));
  });

  app.onActive([
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


  app.onActive([
    'status'
  ], async ({ payload }) => {

    return store.updateStatus(filterStatus(payload));

  });

};