const {
  filterIssue,
  filterPull,
  filterIssueOrPull,
  getIdentifier
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
    'issues.reopened',
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
    'issues.demilestoned'
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
    'pull_request.reopened',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.edited',
    'pull_request.ready_for_review',
    'pull_request.assigned',
    'pull_request.unassigned',
    'pull_request.synchronize',
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

  // milestones /////////////////////

  webhookEvents.on([
    'milestone.edited'
  ], async ({ payload }) => {

    const {
      milestone
    } = payload;

    await store.updateIssues(issue => {

      if (issue.milestone && issue.milestone.id === milestone.id) {
        return {
          milestone
        };
      }
    });
  });

  // labels ///////////////////////

  webhookEvents.on([
    'label.edited'
  ], async ({ payload }) => {

    const {
      label
    } = payload;

    await store.updateIssues(issue => {

      const issueLabels = issue.labels || [];

      const existingIndex = issueLabels.findIndex(l => l.id === label.id);

      if (existingIndex !== -1) {

        return {
          labels: [
            ...issueLabels.slice(0, existingIndex),
            label,
            ...issueLabels.slice(existingIndex + 1)
          ]
        };
      }
    });
  });

};