function repoAndOwner(issue) {
  const {
    repository
  } = issue;

  const {
    owner
  } = repository;

  return {
    repo: repository.name,
    owner: owner.login
  };
}

module.exports.repoAndOwner = repoAndOwner;