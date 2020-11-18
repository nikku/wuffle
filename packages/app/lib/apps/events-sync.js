const {
  filterIssue,
  filterPull,
  filterIssueOrPull,
  filterRepository,
  getIdentifier,
  getKey
} = require('../filters');


/**
 * This component updates the stored issues based on GitHub events.
 *
 * @param {import("./webhook-events/WebhookEvents")} webhookEvents
 * @param {import("../store")} store
 * @param {import("../types").Logger} logger
 */
module.exports = function EventsSync(webhookEvents, store, logger) {

  const log = logger.child({
    name: 'wuffle:user-access'
  });

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

  webhookEvents.on([
    'label.deleted'
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
            ...issueLabels.slice(existingIndex + 1)
          ]
        };
      }
    });
  });

  // repository ///////////////////////

  // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhook-events-and-payloads#repository

  webhookEvents.on([
    'repository.renamed'
  ], async ({ payload }) => {

    const {
      repository
    } = payload;

    await store.updateIssues(issue => {

      if (issue.repository.id === repository.id) {
        return {
          key: getKey(issue, repository),
          repository: filterRepository(repository)
        };
      }
    });
  });

  webhookEvents.on([
    'repository.transferred'
  ], async ({ payload }) => {

    // rename issues in repository

  });


  // issue_comment ///////////////////////

  // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhook-events-and-payloads#issue_comment

  webhookEvents.on([
    'issue_comment.created',
    'issue_comment.edited'
  ], async ({ payload }) => {

    // necro bump issue
  });


  // issues ///////////////////////////////

  // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhook-events-and-payloads#issues

  // issue transfer is mapped to the following GitHub events
  //
  // -> issues.opened (new issue is being opened by GitHub)
  // -> issues.transferred (old issue was deleted by GitHub)
  //
  // Labels are not taken over during the transfer, thus we cannot retain
  // the column mapping. We do, however retain the order.
  //
  webhookEvents.on([
    'issues.transferred'
  ], async ({ payload }) => {

    const {
      issue,
      repository,
      changes
    } = payload;

    const {
      new_issue: newIssue,
      new_repository: newRepository
    } = changes;

    const storedIssue = store.getIssueById(getIdentifier(issue, repository));

    if (!storedIssue) {
      log.warn({ issue: issue.id }, 'stored original issue not found');

      return;
    }

    const newStoredIssue = store.getIssueById(getIdentifier(newIssue, newRepository));

    if (newStoredIssue) {
      await store.updateIssue({
        id: newStoredIssue.id,
        order: storedIssue.order
      });
    } else {
      log.warn({ issue: newIssue.id }, 'stored transferred issue not found');
    }

    return store.removeIssueById(storedIssue.id);
  });

};