function getKey(githubIssueOrPull, repository) {
  return `${repository.owner.login}/${repository.name}#${githubIssueOrPull.number}`;
}

module.exports.getKey = getKey;


function getIdentifier(githubIssueOrPull, repository) {
  return `${repository.id}-${githubIssueOrPull.number}`;
}

module.exports.getIdentifier = getIdentifier;

function getStatusKey(context) {
  return `${context.toUpperCase()}`;
}

module.exports.getStatusKey = getStatusKey;

function filterIssueOrPull(githubIssueOrPull, repository) {

  if ('issue_url' in githubIssueOrPull) {
    return filterPull(githubIssueOrPull, repository);
  } else {
    return filterIssue(githubIssueOrPull, repository);
  }
}

module.exports.filterIssueOrPull = filterIssueOrPull;


function filterRepository(githubRepository) {

  const {
    id,
    name,
    'private': isPrivate,
    owner
  } = githubRepository;

  return {
    id,
    name,
    'private': isPrivate,
    owner: filterUser(owner)
  };
}

module.exports.filterRepository = filterRepository;


function filterUser(githubUser) {

  const {
    id,
    login,
    avatar_url
  } = githubUser;

  return {
    id,
    login,
    avatar_url
  };
}

module.exports.filterUser = filterUser;


function filterLabel(githubLabel) {

  const {
    id,
    name,
    color
  } = githubLabel;

  return {
    id,
    name,
    color
  };
}

module.exports.filterLabel = filterLabel;


function filterBase(githubBase) {
  const {
    ref,
    sha,
    user,
    repo
  } = githubBase;

  return {
    ref,
    sha,
    user: filterUser(user),
    repo: filterRepository(repo)
  };
}

module.exports.filterBase = filterBase;


function filterMilestone(githubMilestone) {

  const {
    id,
    number,
    title,
    state
  } = githubMilestone;

  return {
    id,
    number,
    title,
    state
  };
}

module.exports.filterMilestone = filterMilestone;


function filterPull(githubPull, githubRepository) {

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
  } = githubPull;

  // stable ID that is independent from GitHubs internal issue/pr distinction
  const id = getIdentifier(githubPull, githubRepository);

  const key = getKey(githubPull, githubRepository);

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
    repository: filterRepository(githubRepository)
  };
}

module.exports.filterPull = filterPull;


function filterIssue(githubIssue, githubRepository) {

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
  } = githubIssue;

  // stable ID that is independent from GitHubs internal issue/pr distinction
  const id = getIdentifier(githubIssue, githubRepository);

  const key = getKey(githubIssue, githubRepository);

  // handle issues which are actual pull requests
  const url = pull_request ? pull_request.url : githubIssue.url;

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
    repository: filterRepository(githubRepository),
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
