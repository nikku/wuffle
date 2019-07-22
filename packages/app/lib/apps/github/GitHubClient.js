const {
  GitHubAPI,
  ProbotOctokit
} = require('probot/lib/github');


function GitHubClient(app, logger) {

  const log = logger.child({
    name: 'wuffle:github-client'
  });

  // cached data ///////////////////

  let authByLogin = {};

  let installationsByLogin = null;


  // reactivity ////////////////////

  // TODO: nikku periodically expire installations / authByLogin

  // https://developer.github.com/v3/activity/events/types/#installationevent
  app.on('installation', () => {

    log.debug('installations update, resetting cache');

    // expire cached entries
    installationsByLogin = null;
    authByLogin = {};
  });


  // functionality /////////////////

  /**
   * Return map of installations, grouped by org / login.
   *
   * @return {Promise<Object<String, Installation>>}
   */
  function getInstallationsByLogin() {

    installationsByLogin = installationsByLogin || app.getInstallations().then(
      installations => installations.reduce((byLogin, installation) => {
        byLogin[installation.account.login] = installation;

        return byLogin;
      }, {})
    );

    return installationsByLogin;
  }

  function getInstallationByLogin(login) {
    return getInstallationsByLogin().then(installationsByLogin => {
      const installation = installationsByLogin[login];

      if (!installation) {
        throw new Error('not installed for ' + login);
      }

      return installation;
    });
  }

  function getInstallationScoped(id) {
    return app.auth(id);
  }

  function getOrgScoped(login) {

    let auth = authByLogin[login];

    if (auth) {
      return auth;
    }

    log.info({ login }, 'fetching auth');

    auth = authByLogin[login] =
      getInstallationByLogin(login)
        .then(
          installation => this.getInstallationScoped(installation.id),
          error => {
            log.error({ login }, 'failed to authenticate', error);
            throw error;
          }
        );

    return auth;
  }

  function getUserScoped(token) {

    return Promise.resolve(
      GitHubAPI({
        Octokit: ProbotOctokit,
        auth: `token ${token}`,
        logger: logger.child({ name: 'github:user-auth' })
      })
    );

  }


  // api ////////////////////

  this.getInstallationScoped = getInstallationScoped;
  this.getOrgScoped = getOrgScoped;
  this.getUserScoped = getUserScoped;

}

module.exports = GitHubClient;