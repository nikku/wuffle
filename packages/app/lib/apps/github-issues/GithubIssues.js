import { findLinks, linkTypes } from '../../util/index.js';

const {
  CLOSES
} = linkTypes;

/**
 * @typedef { import('probot').Context } ProbotContext
 *
 * @typedef { import('../../columns.js').ColumnDefinition } ColumnDefinition
 */

/**
 * Moves GitHub issues between board columns by applying the
 * corresponding state (open/closed), label, and assignee changes
 * via the GitHub API.
 *
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

  /**
   * Return the assignee update required to add `newAssignee` to the
   * issue, or an empty object if the assignee is already set or not
   * provided.
   *
   * @param {Object} issue
   * @param {string|null} newAssignee
   *
   * @return {{ assignees?: string[] }}
   */
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

  /**
   * Return the state update (`open` / `closed`) required to reflect
   * the new column, or an empty object if no change is needed.
   *
   * @param {Object} issue
   * @param {ColumnDefinition} newColumn
   *
   * @return {{ state?: 'open'|'closed' }}
   */
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

  /**
   * Return the label changes required to reflect the new column:
   * the column label to add and any other column labels to remove.
   *
   * @param {Object} issue
   * @param {ColumnDefinition} newColumn
   *
   * @return {{ addLabels: string[], removeLabels: string[] }}
   */
  function getLabelUpdate(issue, newColumn) {

    const issueLabels = /** @type { string[] } */ (
      issue.labels.map(l => l.name)
    );

    const newLabel = newColumn.label;

    const addLabels = (!newLabel || issueLabels.includes(newLabel)) ? [] : [ newLabel ];

    const removeLabels = /** @type { string[] } */ (
      columns.getAll().map(c => c.label).filter(
        label => label && label !== newLabel && issueLabels.includes(label)
      )
    );

    return {
      addLabels,
      removeLabels
    };
  }

  /**
   * @param {ProbotContext} context
   * @param {number} issue_number
   */
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

  /**
   * Fetch an issue by number and move it to a new column if the
   * optional predicate passes. Resolves to `false` if the issue is
   * not found or the predicate rejects it.
   *
   * @param {ProbotContext} context
   * @param {number} number
   * @param {ColumnDefinition} newColumn
   * @param {string|null} newAssignee
   * @param {(issue: Object) => boolean} [test]
   *
   * @return {Promise<void|false>}
   */
  async function findAndMoveIssue(context, number, newColumn, newAssignee, test = (issue) => true) {
    const issue = await findIssue(context, number);

    if (!issue || !test(issue)) {
      return false;
    }

    return moveIssue(context, issue, newColumn, newAssignee);
  }

  /**
   * Move all issues referenced via `closes` links in the given issue
   * or pull request body to a new column.
   *
   * Only issues within the same repository are moved.
   *
   * @param {ProbotContext} context
   * @param {Object} issue
   * @param {ColumnDefinition} newColumn
   * @param {string|null} [newAssignee=null]
   *
   * @return {Promise<(void|false)[]>}
   */
  async function moveReferencedIssues(context, issue, newColumn, newAssignee = null) {

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

  /**
   * Move an issue to a new column, applying state, label, and
   * assignee updates via the GitHub API.
   *
   * @param {ProbotContext} context
   * @param {Object} issue
   * @param {ColumnDefinition} newColumn
   * @param {string|null} [newAssignee=null]
   *
   * @return {Promise<void>}
   */
  function moveIssue(context, issue, newColumn, newAssignee = null) {

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

    return Promise.all(invocations).then(() => {});
  }


  // api /////////////////////////////

  /**
   * Move an issue to a new column, applying state, label, and
   * assignee updates via the GitHub API.
   *
   * @param {ProbotContext} context
   * @param {Object} issue
   * @param {ColumnDefinition} newColumn
   * @param {string} [newAssignee]
   *
   * @return {Promise<void>}
   */
  this.moveIssue = moveIssue;

  /**
   * Move all issues referenced via `closes` links in the given issue
   * or pull request body to a new column.
   *
   * Only issues within the same repository are moved.
   *
   * @param {ProbotContext} context
   * @param {Object} issue
   * @param {ColumnDefinition} newColumn
   * @param {string|null} [newAssignee=null]
   *
   * @return {Promise<(void|false)[]>}
   */
  this.moveReferencedIssues = moveReferencedIssues;

  /**
   * Return the state update (`open` / `closed`) required to reflect
   * the new column, or an empty object if no change is needed.
   *
   * @param {Object} issue
   * @param {ColumnDefinition} newColumn
   *
   * @return {{ state?: 'open'|'closed' }}
   */
  this.getStateUpdate = getStateUpdate;

  /**
   * Return the assignee update required to add `newAssignee` to the
   * issue, or an empty object if the assignee is already set or not
   * provided.
   *
   * @param {Object} issue
   * @param {string} [newAssignee]
   *
   * @return {{ assignees?: string[] }}
   */
  this.getAssigneeUpdate = getAssigneeUpdate;

  /**
   * Return the label changes required to reflect the new column:
   * the column label to add and any other column labels to remove.
   *
   * @param {Object} issue
   * @param {ColumnDefinition} newColumn
   *
   * @return {{ addLabels: string[], removeLabels: string[] }}
   */
  this.getLabelUpdate = getLabelUpdate;

  /**
   * Fetch an issue by number and move it to a new column if the
   * optional predicate passes. Resolves to `false` if the issue is
   * not found or the predicate rejects it.
   *
   * @param {ProbotContext} context
   * @param {number} number
   * @param {ColumnDefinition} newColumn
   * @param {string|null} newAssignee
   * @param {(issue: Object) => boolean} [test]
   *
   * @return {Promise<void|false>}
   */
  this.findAndMoveIssue = findAndMoveIssue;

}


// helpers //////////////

function hasKeys(obj) {
  return Object.keys(obj).length > 0;
}