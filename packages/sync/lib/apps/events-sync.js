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

    store.updateIssue({
      type: 'issue',
      ...issue,
      repository
    });
  });

  app.onActive([
    'issues.labeled',
    'issues.unlabeled',
    'issues.milestoned',
    'issues.demilestoned',
    'issues.assigned',
    'issues.unassigned',
    'issues.edited',
    'issues.closed'
  ], async ({ payload }) => {
    const {
      issue,
      repository
    } = payload;

    store.updateIssue({
      type: 'issue',
      ...issue,
      repository
    });
  });

  app.onActive([
    'issues.deleted'
  ], async ({ payload }) => {
    const {
      issue,
      repository
    } = payload;

    store.removeIssue({
      type: 'issue',
      ...issue,
      repository
    });
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

    store.updateIssue({
      type: 'pull-request',
      ...pull_request,
      repository
    });
  });

  app.onActive([
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.edited',
    'pull_request.ready_for_review',
    'pull_request.assigned',
    'pull_request.unassigned',
    'pull_request.closed'
  ], async ({ payload }) => {
    const {
      pull_request,
      repository
    } = payload;

    store.updateIssue({
      type: 'pull-request',
      ...pull_request,
      repository
    });
  });

};