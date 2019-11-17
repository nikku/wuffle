const {
  GitHubAPI,
  ProbotOctokit
} = require('probot/lib/github');


function GitHubClient(app, webhookEvents, logger, githubApp) {

  const log = logger.child({
    name: 'wuffle:github-client'
  });

  // cached data ///////////////////

  let authByLogin = {};


  // reactivity ////////////////////

  webhookEvents.on('installation', () => {
    authByLogin = {};
  });


  // functionality /////////////////

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
      githubApp.getInstallationByLogin(login)
        .then(
          installation => this.getInstallationScoped(installation.id),
          error => {
            log.error({ login }, 'failed to authenticate', error);
            throw error;
          }
        );

    return auth;
  }

  function getUserScoped(user) {

    const access_token = typeof user === 'string' ? user : user.access_token;

    return Promise.resolve(
      GitHubAPI({
        Octokit: ProbotOctokit,
        auth: `token ${access_token}`,
        logger: logger.child({ name: 'github:user-auth' })
      })
    );

  }


  // api ////////////////////

  this.getAppScoped = githubApp.getAppScopedClient;

  this.getInstallationScoped = getInstallationScoped;

  this.getOrgScoped = getOrgScoped;

  this.getUserScoped = getUserScoped;

}

module.exports = GitHubClient;