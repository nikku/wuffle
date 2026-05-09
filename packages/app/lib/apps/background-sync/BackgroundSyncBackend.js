/**
 * @typedef { import('../github-app/types.js').Installation } Installation
 */

/**
 * This component fetches GitHub data required for background synchronization.
 *
 * @constructor
 *
 * @param {import('../github-client/GithubClient.js').default} githubClient
 * @param {import('../github-app/GithubApp.js').default} githubApp
 */
export default function BackgroundSyncBackend(githubClient, githubApp) {

  /**
   * Return available installations.
   *
   * @return {Promise<Installation[]>}
   */
  async function getInstallations(installation) {
    return githubApp.getInstallations();
  }

  /**
   * Return repositories accessible to a GitHub app installation.
   *
   * @param {Installation} installation
   *
   * @return {Promise<Array>}
   */
  async function getInstallationRepositories(installation) {
    const owner = installation.account.login;
    const octokit = await githubClient.getOrgScoped(owner);

    return octokit.paginate(
      octokit.rest.apps.listReposAccessibleToInstallation,
      { per_page: 100 }
    );
  }

  /**
   * Fetch issues and pull requests for a repository.
   *
   * @param {{ owner: { login: string }, name: string }} repository
   * @param {number} syncClosedSince
   *
   * @return {Promise<{ open_issues: Array, closed_issues: Array, open_pull_requests: Array, closed_pull_requests: Array }>}
   */
  async function getRepositoryIssuesAndPulls(repository, syncClosedSince) {
    const owner = repository.owner.login;
    const octokit = await githubClient.getOrgScoped(owner);

    const repo = repository.name;

    const params = {
      sort: /** @type { 'updated' } */ ('updated'),
      direction: /** @type { 'desc' } */ ('desc'),
      per_page: 100,
      owner,
      repo
    };

    const [
      open_issues,
      closed_issues,
      open_pull_requests,
      closed_pull_requests
    ] = await Promise.all([

      // open issues
      octokit.paginate(
        octokit.rest.issues.listForRepo,
        {
          ...params,
          state: 'open'
        },
        response => response.data.filter(issue => !('pull_request' in issue))
      ),

      // closed issues, updated since syncClosedSince
      octokit.paginate(
        octokit.rest.issues.listForRepo,
        {
          ...params,
          state: 'closed',
          since: new Date(syncClosedSince).toISOString()
        },
        response => response.data.filter(issue => !('pull_request' in issue))
      ),

      // open pulls, all
      octokit.paginate(
        octokit.rest.pulls.list,
        {
          ...params,
          state: 'open'
        }
      ),

      // closed pulls, updated since syncClosedSince
      octokit.paginate(
        octokit.rest.pulls.list,
        {
          ...params,
          state: 'closed'
        },
        (response, done) => {

          const pulls = response.data;

          const filtered = pulls.filter(
            pull => new Date(pull.updated_at).getTime() > syncClosedSince
          );

          if (filtered.length !== pulls.length) {
            done();
          }

          return filtered;
        }
      )
    ]);

    return {
      open_issues,
      closed_issues,
      open_pull_requests,
      closed_pull_requests
    };
  }


  // api ///////////////////

  this.getInstallations = getInstallations;

  this.getInstallationRepositories = getInstallationRepositories;

  this.getRepositoryIssuesAndPulls = getRepositoryIssuesAndPulls;
}
