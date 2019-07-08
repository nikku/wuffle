const {
  findLinks,
  linkTypes
} = require('../util');

const {
  CLOSES
} = linkTypes;

const IN_PROGRESS = 'In Progress';
const NEEDS_REVIEW = 'Needs Review';
const DONE = 'Done';

const allButClosedLinkTypes = Object.keys(linkTypes).filter(linkType => {
  return linkType !== CLOSES;
}).reduce((filteredLinkTypes, linkType) => {
  filteredLinkTypes[linkType] = linkTypes[linkType];
  return filteredLinkTypes;
}, {});

/**
 * This component implements automatic movement of issues
 * across the board, as long as the user adheres to a specified
 * dev flow.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  const log = app.log.child({
    name: 'wuffle:automatic-dev-flow'
  });

  const columns = config.columns;

  function getCurrentColumns(issue) {
    return columns.filter(c => issue.labels.some(l => l.name === c.label));
  }

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

  async function moveReferencedIssues(context, issue, newState, newAssignee, linkTypes) {

    // TODO(nikku): do that lazily, i.e. react to PR label changes?
    // would slower the movement but support manual moving-issue with PR

    const {
      repo: issueRepo,
      owner: issueOwner
    } = context.repo();

    const links = findLinks(issue, linkTypes).filter(link => {
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

  app.onActive([
    'issues.closed',
    'pull_request.closed'
  ], async (context) => {

    const {
      pull_request,
      issue
    } = context.payload;
    log.info('Issue/PR request closed', context.payload.number)

    await Promise.all([
      pull_request ? moveReferencedIssues(context, pull_request, IN_PROGRESS, undefined, allButClosedLinkTypes) : Promise.resolve(),
      moveIssue(context, issue || pull_request, DONE)
    ]);
  });

  app.onActive('pull_request.ready_for_review', async (context) => {

    const {
      pull_request
    } = context.payload;
    log.info('PR request ready_for_review', context.payload.number)

    await Promise.all([
      moveIssue(context, pull_request, NEEDS_REVIEW),
      moveReferencedIssues(context, pull_request, NEEDS_REVIEW)
    ]);
  });

  app.onActive([
    'pull_request.opened',
    'pull_request.reopened'
  ], async (context) => {

    const {
      pull_request
    } = context.payload;

    const newState = isDraft(pull_request) ? IN_PROGRESS : NEEDS_REVIEW;
    log.info('PR request opened', context.payload.number, newState);

    await Promise.all([
      moveIssue(context, pull_request, newState),
      moveReferencedIssues(context, pull_request, newState)
    ]);
  });

  app.onActive('pull_request.edited', async (context) => {

    const {
      pull_request
    } = context.payload;

    const columns = getCurrentColumns(pull_request);
    log.info('PR request edited', context.payload.number, columns);

    // move issue to reflect PR lazy reference

    if (columns.length) {
      await moveReferencedIssues(context, pull_request, columns[0].name);
    }
  });

  app.onActive('create', async (context) => {

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
    log.info('Something created', context.payload.number, issue_number);

    return findAndMoveIssue(context, issue_number, IN_PROGRESS, assignee);
  });


  // API /////////////////////////////

  app.moveIssue = moveIssue;

  app.moveReferencedIssues = moveReferencedIssues;

  app.getStateUpdate = getStateUpdate;

  app.getAssigneeUpdate = getAssigneeUpdate;

};



// helpers //////////////////////

function hasKeys(obj) {
  return Object.keys(obj).length > 0;
}

function isDraft(pull_request) {
  const {
    title,
    draft
  } = pull_request;

  return draft || /wip([^a-z]+|$)/i.test(title);
}