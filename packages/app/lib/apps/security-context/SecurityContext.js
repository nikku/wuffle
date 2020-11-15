function SecurityContext(githubClient) {

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
    } = await github.users.getAuthenticated();

    return user;
  };

}

module.exports = SecurityContext;