/**
 * @constructor
 *
 * @param {import('../github-client/GithubClient.js').default} githubClient
 */
export default function SecurityContext(githubClient) {

  /**
   * Get authenticated user by token.
   *
   * @param {string} token
   *
   * @return Promise<User>
   */
  this.getAuthenticatedUser = async function(token) {
    const github = await githubClient.getUserScoped(token);

    const {
      data: user
    } = await github.rest.users.getAuthenticated();

    return user;
  };

}