import { repoAndOwner } from '../../util/index.js';

import gql from 'fake-tag';

/**
 * @typedef { {
 *   id: number,
 *   node_id: string,
 *   body: string,
 *   created_at: string,
 *   authorAssociation: string,
 *   html_url: string,
 *   user: {
 *     id: number,
 *     node_id: string,
 *     login: string,
 *     avatar_url: string,
 *     html_url: string,
 *     type: string
 *   }
 * } } GithubComment
 *
 * @typedef { import('../../util/meta.js').Issue } Issue
 */


/**
 * This component fetches GitHub comments data required for background synchronization.
 *
 * @constructor
 *
 * @param {import('../github-client/GithubClient.js').default} githubClient
 */
export default function GithubCommentsBackend(githubClient) {

  /**
   * Return comments for given issue.
   *
   * @param {Issue} issue
   *
   * @return {Promise<GithubComment[]>}
   */
  this.getIssueComments = async function(issue) {

    const {
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
          html_url: url,
          type: __typename
          ... on User {
            id: databaseId
            node_id: id
          }
          ... on Bot {
            id: databaseId
            node_id: id
          }
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
      }`,
    {
      owner,
      repo,
      issue_number: number
    });

    const comments = /** @type { GithubComment[] } */ (
      result.repository.issueOrPullRequest.comments.edges.map(e => e.node)
    );

    return comments;
  };
}