import { findLinks, linkTypes } from '../../util/index.js';

const {
  CLOSES
} = linkTypes;


/**
 * @constructor
 *
 * @param {any} config
 * @param {import('../../types.js').Logger} logger
 * @param {import('../../columns.js').default} columns
 */
export default function GithubIssues(config, logger, columns) {

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

  function findIssue(context, issue_number) {

    const params = context.repo({ issue_number });

    return context.octokit.rest.issues.get(params)
      .then(response => response.data)
      .catch(err => {

        // gracefully handle not found
        log.debug({ ...params, err }, 'issue not found');

        return null;
      });
  }

  function findAndMoveIssue(context, number, newColumn, newAssignee, test = (issue) => true) {
    return findIssue(context, number)
      .then((issue) => issue && test(issue) && moveIssue(context, issue, newColumn, newAssignee));
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

  function moveIssue(context, issue, newColumn, newAssignee) {

    const {
      number: issue_number
    } = issue;

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
        context.octokit.rest.issues.addLabels(addLabelParams)
      );
    }

    if (hasKeys(update)) {

      const params = context.repo({
        issue_number,
        ...update
      });

      log.info(params, 'update');

      invocations.push(
        context.octokit.rest.issues.update(params)
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
        context.octokit.rest.issues.removeLabel(removeLabelParams).catch(err => {

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


// helpers //////////////

function hasKeys(obj) {
  return Object.keys(obj).length > 0;
}