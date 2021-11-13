const gql = require('fake-tag');

const { graphql } = require('@octokit/graphql');

const authenticatedGraphql = graphql.defaults({
  headers: {
    authorization: `token ${process.env.TOKEN}`
  }
});

const convertToDraftQuery = gql`
  mutation ConvertToDraft($pull_id: ID!) {
    convertPullRequestToDraft(input: { pullRequestId: $pull_id }) {
      pullRequest {
        updatedAt
      }
    }
  }
`;

const markReadyForReviewQuery = gql`
  mutation MarkReadyForReview($pull_id: ID!) {
    markPullRequestReadyForReview(input: { pullRequestId: $pull_id }) {
      pullRequest {
        updatedAt
      }
    }
  }
`;

authenticatedGraphql(markReadyForReviewQuery, {"pull_id": "MDExOlB1bGxSZXF1ZXN0MzI3NTkzNTc2" }).then(result => {
  console.log(result);
}).catch(err => {
  console.error(err);
});