const IN_PROGRESS = 'IN_PROGRESS';
const IN_REVIEW = 'IN_REVIEW';
const CLOSED = 'CLOSED';


/**
 * This component implements automatic movement of issues
 * across the board, as long as the user adheres to a specified
 * dev flow.
 *
 * @param {WebhookEvents} webhookEvents
 * @param {GithubIssues} githubIssues
 * @param {Columns} columns
 */
module.exports = function(webhookEvents, githubIssues, columns) {

  webhookEvents.on([
    'issues.closed',
    'pull_request.closed'
  ], async (context) => {

    const {
      pull_request,
      issue
    } = context.payload;

    const column = columns.getByState(CLOSED);

    await githubIssues.moveIssue(context, issue || pull_request, column);
  });

  webhookEvents.on('pull_request.ready_for_review', async (context) => {

    const {
      pull_request
    } = context.payload;

    const column = columns.getByState(IN_REVIEW);

    await Promise.all([
      githubIssues.moveIssue(context, pull_request, column),
      githubIssues.moveReferencedIssues(context, pull_request, column)
    ]);
  });

  webhookEvents.on([
    'pull_request.opened',
    'pull_request.reopened'
  ], async (context) => {

    const {
      pull_request
    } = context.payload;

    const newState = isDraft(pull_request) ? IN_PROGRESS : IN_REVIEW;

    const column = columns.getByState(newState);

    await Promise.all([
      githubIssues.moveIssue(context, pull_request, column),
      githubIssues.moveReferencedIssues(context, pull_request, column)
    ]);
  });

  webhookEvents.on('pull_request.edited', async (context) => {

    const {
      pull_request
    } = context.payload;

    const column = columns.getIssueColumn(pull_request);

    await githubIssues.moveReferencedIssues(context, pull_request, column);
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

    const column = columns.getByState(IN_PROGRESS);

    return githubIssues.findAndMoveIssue(context, issue_number, column, assignee);
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