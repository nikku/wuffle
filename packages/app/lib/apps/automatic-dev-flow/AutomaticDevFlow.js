const DONE = 'DONE';
const EXTERNAL_CONTRIBUTION = 'EXTERNAL_CONTRIBUTION';
const IN_PROGRESS = 'IN_PROGRESS';
const IN_REVIEW = 'IN_REVIEW';
const CHANGES_REQUESTED = 'changes_requested';


/**
 * This component implements automatic movement of issues
 * across the board, as long as the user adheres to a specified
 * dev flow.
 *
 * @constructor
 *
 * @param {import('../webhook-events/WebhookEvents.js').default} webhookEvents
 * @param {import('../github-issues/GithubIssues.js').default} githubIssues
 * @param {import('../../columns.js').default} columns
 * @param {import('../issue-filter/IssueFilter.js').default} issueFilter
 * @param {import('../../types.js').Logger } logger
 */
export default function(webhookEvents, githubIssues, columns, issueFilter, logger) {

  const log = logger.child({
    name: 'wuffle:automatic-dev-flow'
  });

  const ifEnabled = issueFilter.createWebhookFilter(log);

  webhookEvents.on([
    'issues.closed',
    'pull_request.closed'
  ], ifEnabled(async (context) => {

    const column = columns.getByState(DONE);

    const issueOrPull = 'issue' in context.payload
      ? context.payload.issue
      : context.payload.pull_request;

    await githubIssues.moveIssue(context, issueOrPull, column);
  }));

  webhookEvents.on('pull_request.converted_to_draft', ifEnabled(async (context) => {

    const {
      pull_request
    } = context.payload;

    const state = isExternal(pull_request) ? EXTERNAL_CONTRIBUTION : IN_PROGRESS;

    const column = columns.getByState(state);

    await Promise.all([
      githubIssues.moveIssue(context, pull_request, column),
      githubIssues.moveReferencedIssues(context, pull_request, column)
    ]);
  }));

  webhookEvents.on([
    'pull_request.ready_for_review',
    'pull_request.review_requested'
  ], ifEnabled(async (context) => {

    const {
      pull_request,
      action
    } = context.payload;

    // do not forcefully move draft PRs into review,
    // these shall be marked as _ready for review_ first
    if (action === 'review_requested' && pull_request.draft) {
      return;
    }

    const state = isExternal(pull_request) ? EXTERNAL_CONTRIBUTION : IN_REVIEW;

    const column = columns.getByState(state);

    await Promise.all([
      githubIssues.moveIssue(context, pull_request, column),
      githubIssues.moveReferencedIssues(context, pull_request, column)
    ]);
  }));

  webhookEvents.on([
    'pull_request.opened',
    'pull_request.reopened'
  ], ifEnabled(async (context) => {

    const {
      pull_request
    } = context.payload;

    const external = isExternal(pull_request);
    const draft = isDraft(pull_request);

    const newState =
      external ? EXTERNAL_CONTRIBUTION : (
        draft ? IN_PROGRESS : IN_REVIEW
      );

    const column = columns.getByState(newState);

    const author = pull_request.user;

    const newAssignee = (
      process.env.AUTO_ASSIGN_PULLS && !external &&
      author && author.type === 'User' && author.login
    ) || null;

    await Promise.all([
      githubIssues.moveIssue(context, pull_request, column, newAssignee),
      githubIssues.moveReferencedIssues(context, pull_request, column, newAssignee)
    ]);
  }));

  webhookEvents.on('pull_request.edited', ifEnabled(async (context) => {

    const {
      pull_request
    } = context.payload;

    const column = columns.getIssueColumn(pull_request);

    await githubIssues.moveReferencedIssues(context, pull_request, column);
  }));

  webhookEvents.on('pull_request_review.submitted', ifEnabled(async (context) => {

    const {
      pull_request,
      review
    } = context.payload;

    const {
      state: reviewState
    } = review;

    if (reviewState !== CHANGES_REQUESTED) {
      return;
    }

    const state = isExternal(pull_request) ? EXTERNAL_CONTRIBUTION : IN_PROGRESS;

    const column = columns.getByState(state);

    await Promise.all([
      githubIssues.moveIssue(context, pull_request, column),
      githubIssues.moveReferencedIssues(context, pull_request, column)
    ]);
  }));

  webhookEvents.on('create', async (context) => {

    const {
      ref,
      ref_type,
      pusher_type,
      sender
    } = context.payload;

    if (ref_type !== 'branch') {
      return;
    }

    const assignee = pusher_type === 'user' ? sender.login : null;

    const match = /^(\d+)[-_]+/.exec(ref);

    if (!match) {
      return;
    }

    const issue_number = parseInt(match[1], 10);

    const column = columns.getByState(IN_PROGRESS);

    return githubIssues.findAndMoveIssue(
      context,
      issue_number,
      column,
      assignee,
      issue => issue.state === 'open'
    );
  });

}


// helpers //////////////////////

function isDraft(pull_request) {
  const {
    title,
    draft
  } = pull_request;

  return draft || /wip([^a-z]+|$)/i.test(title);
}


function isExternal(pull_request) {

  const {
    base,
    head
  } = pull_request;

  return base.repo.id !== head.repo.id;
}