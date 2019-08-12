const IN_PROGRESS = 'In Progress';
const NEEDS_REVIEW = 'Needs Review';
const DONE = 'Done';


/**
 * This component implements automatic movement of issues
 * across the board, as long as the user adheres to a specified
 * dev flow.
 *
 * @param {WebhookEvents} webhookEvents
 * @param {GithubIssues} githubIssues
 * @param {Object} config
 */
module.exports = function(webhookEvents, githubIssues, config) {

  const columns = config.columns;

  function getCurrentColumns(issue) {
    return columns.filter(c => issue.labels.some(l => l.name === c.label));
  }

  webhookEvents.on([
    'issues.closed',
    'pull_request.closed'
  ], async (context) => {

    const {
      pull_request,
      issue
    } = context.payload;

    await githubIssues.moveIssue(context, issue || pull_request, DONE);
  });

  webhookEvents.on('pull_request.ready_for_review', async (context) => {

    const {
      pull_request
    } = context.payload;

    await Promise.all([
      githubIssues.moveIssue(context, pull_request, NEEDS_REVIEW),
      githubIssues.moveReferencedIssues(context, pull_request, NEEDS_REVIEW)
    ]);
  });

  webhookEvents.on([
    'pull_request.opened',
    'pull_request.reopened'
  ], async (context) => {

    const {
      pull_request
    } = context.payload;

    const newState = isDraft(pull_request) ? IN_PROGRESS : NEEDS_REVIEW;

    await Promise.all([
      githubIssues.moveIssue(context, pull_request, newState),
      githubIssues.moveReferencedIssues(context, pull_request, newState)
    ]);
  });

  webhookEvents.on('pull_request.edited', async (context) => {

    const {
      pull_request
    } = context.payload;

    const columns = getCurrentColumns(pull_request);

    // move issue to reflect PR lazy reference

    if (columns.length) {
      await githubIssues.moveReferencedIssues(context, pull_request, columns[0].name);
    }
  });

  webhookEvents.on('create', async (context) => {

    const {
      ref,
      ref_type,
      pusher_type,
      sender
    } = context.payload;

    if (!ref_type === 'branch') {
      return;
    }

    const assignee = pusher_type === 'user' ? sender.login : null;

    const match = /^(\d+)[-_]+/.exec(ref);

    if (!match) {
      return;
    }

    const issue_number = match[1];

    return githubIssues.findAndMoveIssue(context, issue_number, IN_PROGRESS, assignee);
  });

};


// helpers //////////////////////

function isDraft(pull_request) {
  const {
    title,
    draft
  } = pull_request;

  return draft || /wip([^a-z]+|$)/i.test(title);
}