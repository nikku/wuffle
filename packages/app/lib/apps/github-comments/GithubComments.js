import { filterUser, filterIssue } from '../../filters.js';


/**
 * This component updates the stored issues based on GitHub events.
 *
 * It also hooks into `BackgroundSync` to fetch comments for issues/PRs.
 *
 * @constructor
 *
 * @param {import('../webhook-events/WebhookEvents.js').default} webhookEvents
 * @param {import('../../events.js').default} events
 * @param {import('../../store.js').default} store
 * @param {import('../issue-filter/IssueFilter.js').default} issueFilter
 * @param {import('../../types.js').Logger } logger
 * @param {import('./GithubCommentsBackend.js').default} githubCommentsBackend
 */
export default function GithubComments(webhookEvents, events, store, issueFilter, logger, githubCommentsBackend) {

  const log = logger.child({
    name: 'wuffle:github-comments'
  });

  const ifEnabled = issueFilter.createWebhookFilter(log);

  // issues /////////////////////

  events.on('backgroundSync.sync', async (event) => {

    const {
      issue
    } = event;

    const {
      id
    } = issue;

    const comments = await githubCommentsBackend.getIssueComments(issue);

    await store.queueUpdate({
      id,
      comments: comments.map(filterComment)
    });
  });

  webhookEvents.on([
    'issue_comment.created',
    'issue_comment.edited',
    'issue_comment.deleted'
  ], ifEnabled(async ({ payload }) => {
    const {
      action,
      comment: _comment,
      issue: _issue,
      repository
    } = payload;

    const commentedIssue = filterIssue(_issue, repository);
    const comment = filterComment(_comment);

    const {
      id
    } = commentedIssue;

    const issue = await store.getIssueById(id);

    let comments = Array.isArray(issue.comments)
      ? issue.comments
      : [];

    if (action === 'created') {
      comments = [
        ...comments,
        comment
      ];
    }

    if (action === 'deleted') {
      const index = comments.findIndex(c => c.id === comment.id);

      if (index !== -1) {
        comments = [
          ...comments.slice(0, index),
          ...comments.slice(index + 1)
        ];
      }
    }

    if (action === 'edited') {

      const index = comments.findIndex(c => c.id === comment.id);

      if (index !== -1) {
        comments = [
          ...comments.slice(0, index),
          comment,
          ...comments.slice(index + 1)
        ];
      } else {
        comments = [
          ...comments,
          comment
        ];
      }
    }

    await store.updateIssue({
      ...commentedIssue,
      comments
    });
  }));

}


function filterComment(comment) {

  const {
    id,
    node_id,
    body,
    created_at,
    html_url,
    user
  } = comment;

  return {
    id,
    node_id,
    body,
    created_at,
    html_url,
    user: filterUser(user)
  };
}
