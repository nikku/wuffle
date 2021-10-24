const {
  repoAndOwner
} = require('../../util');

const {
  filterUser,
  filterIssue
} = require('../../filters');

const gql = require('fake-tag');


/**
 * This component updates the stored issues based on GitHub events.
 *
 * @constructor
 *
 * @param {import('../webhook-events/WebhookEvents')} webhookEvents
 * @param {import('../../events')} events
 * @param {import('../github-client/GithubClient')} githubClient
 * @param {import('../../store')} store
 */
function GithubComments(webhookEvents, events, githubClient, store) {

  // issues /////////////////////

  events.on('backgroundSync.sync', async (event) => {

    const {
      issue
    } = event;

    const {
      id,
      number
    } = issue;

    const {
      repo,
      owner
    } = repoAndOwner(issue);

    const github = await githubClient.getOrgScoped(owner);

    const result = await github.graphql(gql`

      fragment CommentInfo on IssueComment {
        id: databaseId
        node_id: id
        body: bodyText
        created_at: publishedAt
        authorAssociation,
        html_url: url,
        user: author {
          login
          avatar_url: avatarUrl,
          html_url: url
        }
      }

      query FetchComments(
        $repo: String!,
        $owner: String!,
        $issue_number: Int!,
        $after: String
      ) {
        repository(name: $repo, owner: $owner) {
          issueOrPullRequest(number: $issue_number) {
            ...on Issue {
              comments(first: 100, after: $after) {
                edges {
                  node {
                    ...CommentInfo
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
                totalCount
              }
            }
            ...on PullRequest {
              comments(first: 100, after: $after) {
                edges {
                  node {
                    ...CommentInfo
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
                totalCount
              }
            }
          }
        }
      }
    `, {
      owner,
      repo,
      issue_number: number
    });

    const comments = (
      result.repository.issueOrPullRequest.comments.edges.map(e => e.node)
    );

    await store.queueUpdate({
      id,
      comments: comments.map(filterComment)
    });
  });

  webhookEvents.on([
    'issue_comment'
  ], async ({ payload }) => {
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
  });

}

module.exports = GithubComments;


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
