const {
  findLinks,
  linkTypes
} = require('../../util');

const {
  CLOSES
} = linkTypes;

const gql = require('fake-tag');


/**
 * @constructor
 *
 * @param {import('../../types').Logger} logger
 * @param {any} config
 * @param {import('../../columns')} columns
 */
function GithubIssues(logger, config, columns) {

  const log = logger.child({
    name: 'wuffle:github-issues'
  });

  function getAssigneeUpdate(issue, newAssignee) {

    if (!newAssignee) {
      return {};
    }

    const assignees = issue.assignees.map(assignee => assignee.login);

    if (assignees.includes(newAssignee)) {
      return {};
    }

    return {
      assignees: [
        ...assignees,
        newAssignee
      ]
    };

  }

  function getStateUpdate(issue, newColumn) {

    let update = {};

    const issueState = newColumn.closed ? 'closed' : 'open';

    if (issue.state !== issueState) {
      update = {
        ...update,
        state: issueState
      };
    }

    return update;
  }

  function getLabelUpdate(issue, newColumn) {

    const issueLabels = issue.labels.map(l => l.name);

    const newLabel = newColumn.label;

    const addLabels = (!newLabel || issueLabels.includes(newLabel)) ? [] : [ newLabel ];

    const removeLabels = columns.getAll().map(c => c.label).filter(
      label => label && label !== newLabel && issueLabels.includes(label)
    );

    return {
      addLabels,
      removeLabels
    };
  }

  function getDraftUpdate(issue, newColumn) {
    if ('draft' in issue) {
      const draft = columns.getByState('IN_PROGRESS') === newColumn;

      if (draft !== issue.draft) {
        return {
          draft
        };
      }
    }

    return {};
  }

  function findIssue(context, issue_number) {

    const params = context.repo({ issue_number });

    return context.octokit.issues.get(params)
      .then(response => response.data)
      .catch(err => {

        // gracefully handle not found
        log.debug({ ...params, err }, 'issue not found');

        return null;
      });
  }

  function findAndMoveIssue(context, number, newColumn, newAssignee) {
    return findIssue(context, number)
      .then((issue) => issue && moveIssue(context, issue, newColumn, newAssignee));
  }

  async function moveReferencedIssues(context, issue, newColumn, newAssignee) {

    // TODO(nikku): do that lazily, i.e. react to PR label changes?
    // would slower the movement but support manual moving-issue with PR

    const {
      repo: issueRepo,
      owner: issueOwner
    } = context.repo();

    const links = findLinks(issue, CLOSES).filter(link => {
      const {
        repo,
        owner
      } = link;

      return (
        (typeof repo === 'undefined' || repo === issueRepo) &&
        (typeof owner === 'undefined' || owner === issueOwner)
      );
    });

    // TODO(nikku): PR from external contributor
    // TODO(nikku): closes across repositories?

    return Promise.all(links.map(link => {

      const {
        number
      } = link;

      return findAndMoveIssue(context, number, newColumn, newAssignee);
    }));
  }

  function updateDraftState(context, pullRequest, draft) {

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

    const ctx = context.repo({
      issue_number: pullRequest.number,
      draft
    });

    log.info(ctx, 'set draft');

    return context.octokit.graphql(
      draft ? convertToDraftQuery : markReadyForReviewQuery,
      {
        pull_id: pullRequest.pull_request_node_id
      }
    ).catch(error => log.error(error, 'failed to set draft', ctx));
  }

  function moveIssue(context, issue, newColumn, newAssignee) {

    const {
      number: issue_number
    } = issue;

    const draftUpdate = getDraftUpdate(issue, newColumn);

    const update = {
      ...getAssigneeUpdate(issue, newAssignee),
      ...getStateUpdate(issue, newColumn)
    };

    const {
      addLabels,
      removeLabels
    } = getLabelUpdate(issue, newColumn);

    const invocations = [];

    if (hasKeys(addLabels)) {

      const addLabelParams = context.repo({
        issue_number,
        labels: addLabels
      });

      log.info(addLabelParams, 'add labels');

      invocations.push(
        context.octokit.issues.addLabels(addLabelParams)
      );
    }

    if (hasKeys(draftUpdate)) {
      const { draft } = draftUpdate;

      invocations.push(
        updateDraftState(context, issue, draft)
      );
    }

    if (hasKeys(update)) {

      const params = context.repo({
        issue_number,
        ...update
      });

      log.info(params, 'update');

      invocations.push(
        context.octokit.issues.update(params)
      );
    }

    for (const label of removeLabels) {

      const removeLabelParams = context.repo({
        issue_number,
        name: label
      });

      log.info({
        ...removeLabelParams,
        label
      }, 'remove label');

      invocations.push(
        context.octokit.issues.removeLabel(removeLabelParams).catch(err => {

          // gracefully handle non-existing label
          // may have been already removed by other
          // integrations
          if (err.status !== 404) {
            return Promise.reject(err);
          }
        })
      );
    }

    return Promise.all(invocations);
  }


  // api /////////////////////////////

  this.moveIssue = moveIssue;

  this.moveReferencedIssues = moveReferencedIssues;

  this.getStateUpdate = getStateUpdate;

  this.getAssigneeUpdate = getAssigneeUpdate;

  this.getLabelUpdate = getLabelUpdate;

  this.findAndMoveIssue = findAndMoveIssue;

}

module.exports = GithubIssues;


// helpers //////////////

function hasKeys(obj) {
  return Object.keys(obj).length > 0;
}