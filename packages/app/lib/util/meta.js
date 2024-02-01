/**
 * @typedef { {
 *   number: number,
 *   repository: {
 *     name: string,
 *     owner: {
 *       login: string
 *     }
 *   }
 * } } Issue
 */

/**
 * @param { Issue } issue
 *
 * @return { { repo: string, owner: string } }
 */
export function repoAndOwner(issue) {
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

/**
 * @param { Issue } issue
 *
 * @return { string }
 */
export function issueIdent(issue) {
  const { owner, repo } = repoAndOwner(issue);

  const { number } = issue;

  return `${owner}/${repo}#${number}`;
}
