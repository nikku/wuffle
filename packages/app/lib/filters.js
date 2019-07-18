function getKey(issueOrPr, repository) {
  return `${repository.owner.login}/${repository.name}#${issueOrPr.number}`;
}

module.exports.getKey = getKey;


function getIdentifier(issueOrPr, repository) {
  return `${repository.id}-${issueOrPr.number}`;
}

module.exports.getIdentifier = getIdentifier;

function getStatusKey(context) {
  return `${context.toUpperCase()}`;
}

module.exports.getStatusKey = getStatusKey;

function filterIssueOrPull(issueOrPr, repository) {

  if ('issue_url' in issueOrPr) {
    return filterPull(issueOrPr, repository);
  } else {
    return filterIssue(issueOrPr, repository);
  }
}

module.exports.filterIssueOrPull = filterIssueOrPull;


function filterRepository(repository) {

  const {
    id,
    name,
    'private': isPrivate,
    owner
  } = repository;

  return {
    id,
    name,
    'private': isPrivate,
    owner: filterUser(owner)
  };
}

module.exports.filterRepository = filterRepository;


function filterUser(user) {

  const {
    id,
    login,
    avatar_url
  } = user;

  return {
    id,
    login,
    avatar_url
  };
}

module.exports.filterUser = filterUser;


function filterLabel(label) {

  const {
    id,
    name,
    color
  } = label;

  return {
    id,
    name,
    color
  };
}

module.exports.filterLabel = filterLabel;


function filterBase(base) {
  const {
    ref,
    sha,
    user,
    repo
  } = base;

  return {
    ref,
    sha,
    user: filterUser(user),
    repo: filterRepository(repo)
  };
}

module.exports.filterBase = filterBase;


function filterMilestone(milestone) {

  const {
    id,
    number,
    title,
    state
  } = milestone;

  return {
    id,
    number,
    title,
    state
  };
}

module.exports.filterMilestone = filterMilestone;


function filterPull(pull_request, repository) {

  const {
    url,
    number,
    state,
    title,
    body,
    created_at,
    updated_at,
    closed_at,
    merged_at,
    merge_commit_sha,
    assignees,
    requested_reviewers,
    labels,
    milestone,
    head,
    base,
    draft,
    merged,
    mergeable,
    mergeable_state,
    merged_by,
    comments,
    review_comments,
    commits,
    additions,
    deletions,
    changed_files
  } = pull_request;

  // stable ID that is independent from GitHubs internal issue/pr distinction
  const id = getIdentifier(pull_request, repository);

  const key = getKey(pull_request, repository);

  return {
    id,
    key,
    url,
    number,
    state,
    title,
    body,
    created_at,
    updated_at,
    closed_at,
    merged_at,
    merge_commit_sha,
    assignees: assignees.map(filterUser),
    requested_reviewers: requested_reviewers.map(filterUser),
    labels: labels.map(filterLabel),
    milestone: milestone ? filterMilestone(milestone) : null,
    head: filterBase(head),
    base: filterBase(base),
    draft,
    merged: (merged || !!merged_at),
    mergeable,
    mergeable_state,
    merged_by,
    comments,
    review_comments,
    commits,
    additions,
    deletions,
    changed_files,
    pull_request: true,
    repository: filterRepository(repository)
  };
}

module.exports.filterPull = filterPull;


function filterIssue(issue, repository) {

  const {
    number,
    state,
    title,
    body,
    created_at,
    updated_at,
    closed_at,
    assignees,
    labels,
    milestone,
    comments,
    pull_request
  } = issue;

  // stable ID that is independent from GitHubs internal issue/pr distinction
  const id = getIdentifier(issue, repository);

  const key = getKey(issue, repository);

  // handle issues which are actual pull requests
  const url = pull_request ? pull_request.url : issue.url;

  return {
    id,
    key,
    url,
    number,
    state,
    title,
    body,
    created_at,
    updated_at,
    closed_at,
    assignees: assignees.map(filterUser),
    labels: labels.map(filterLabel),
    milestone: milestone ? filterMilestone(milestone) : null,
    comments,
    repository: filterRepository(repository),
    pull_request: !!pull_request
  };

}

module.exports.filterIssue = filterIssue;


function filterStatus(payload) {
  const {
    sha,
    target_url,
    context,
    state
  } = payload;

  const contextJob = {
    target_url,
    state
  };
  const key = getStatusKey(context);

  const contexts={};
  contexts[key]= contextJob;

  return {
    sha,
    key,
    contexts
  };
}
module.exports.filterStatus = filterStatus;
