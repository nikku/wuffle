const {
  findLinks,
  linkTypes
} = require('../../util');

const {
  CLOSES
} = linkTypes;


function GithubIssues(logger, config) {

  const log = logger.child({
    name: 'wuffle:github-issues'
  });

  const columns = config.columns;


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

  function getStateUpdate(issue, newState) {

    let update = {};

    const newColumn = columns.find(c => c.name === newState);

    const issueState = newColumn.closed ? 'closed' : 'open';

    if (issue.state !== issueState) {
      update = {
        ...update,
        state: issueState
      };
    }

    const issueLabels = issue.labels.map(l => l.name);

    const newLabel = newColumn.label;

    const labelsToAdd = (!newLabel || issueLabels.includes(newLabel)) ? [] : [ newLabel ];

    const labelsToRemove = columns.map(c => c.label).filter(
      label => label && label !== newLabel && issueLabels.includes(label)
    );

    if (labelsToRemove.length || labelsToAdd.length) {
      update = {
        ...update,
        labels: [
          ...issueLabels.filter(l => !labelsToRemove.includes(l)),
          ...labelsToAdd
        ]
      };
    }

    return update;
  }

  function findIssue(context, issue_number) {

    const params = context.repo({ issue_number });

    return context.github.issues.get(params)
      .then(response => response.data)
      .catch(error => {
        // gracefully handle not found
        log.error(params, 'not found');

        return null;
      });
  }

  function findAndMoveIssue(context, number, newState, newAssignee) {
    return findIssue(context, number)
      .then((issue) => issue && moveIssue(context, issue, newState, newAssignee));
  }

  async function moveReferencedIssues(context, issue, newState, newAssignee) {

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

      return findAndMoveIssue(context, number, newState, newAssignee);
    }));
  }

  function moveIssue(context, issue, newState, newAssignee) {

    const {
      number: issue_number
    } = issue;

    const update = {
      ...getAssigneeUpdate(issue, newAssignee),
      ...getStateUpdate(issue, newState)
    };

    if (!hasKeys(update)) {
      return;
    }

    const params = context.repo({
      issue_number,
      ...update
    });

    log.info(params, 'update');

    return context.github.issues.update(params);
  }


  // api /////////////////////////////

  this.moveIssue = moveIssue;

  this.moveReferencedIssues = moveReferencedIssues;

  this.getStateUpdate = getStateUpdate;

  this.getAssigneeUpdate = getAssigneeUpdate;

  this.findAndMoveIssue = findAndMoveIssue;

}

module.exports = GithubIssues;


// helpers //////////////

function hasKeys(obj) {
  return Object.keys(obj).length > 0;
}