const {
  ProbotOctokit
} = require('probot/lib/octokit/probot-octokit');

const {
  Cache
} = require('../../util');


// 15 minutes
const TTL = 1000 * 60 * 15;

/**
 * @typedef { import('../../types').Octokit } Octokit
 * @typedef { { [x: string]: Promise<Octokit> } } LoginCache
 */

/**
 * @constructor
 *
 * @param {import('../../types').ProbotApp} app
 * @param {import('../webhook-events/WebhookEvents')} webhookEvents
 * @param {import('../../types').Logger} logger
 * @param {import('../github-app/GithubApp')} githubApp
 * @param {import('../../events')} events
 */
function GitHubClient(app, webhookEvents, logger, githubApp, events) {

  const log = logger.child({
    name: 'wuffle:github-client'
  });

  const cache = new Cache(TTL);

  // cached data ///////////////////

  let authByLogin = /** @type { LoginCache } */ ({});


  // reactivity ////////////////////

  webhookEvents.on('installation', () => {
    authByLogin = {};
  });


  // functionality /////////////////

  /**
   * @param {number} id
   *
   * @return {Promise<Octokit>}
   */
  function getInstallationScoped(id) {
    return app.auth(id);
  }

  /**
   * @param {string} login
   *
   * @return {Promise<Octokit>}
   */
  function getOrgScoped(login) {

    let auth = authByLogin[login];

    if (auth) {
      return auth;
    }

    log.info({ login }, 'fetching auth');

    auth = authByLogin[login] =
      githubApp.getInstallationByLogin(login)
        .then(
          installation => getInstallationScoped(installation.id),
          err => {
            log.error({
              err,
              login
            }, 'failed to authenticate');

            throw err;
          }
        );

    return auth;
  }

  /**
   * Return user scoped octokit instance.
   *
   * @param {string|{ access_token: string }} user
   *
   * @return {Promise<Octokit>}
   */
  function getUserScoped(user) {

    const access_token = typeof user === 'string' ? user : user.access_token;

    const log = logger.child({ name: 'github:user-auth' });

    return cache.get(`user_scoped=${access_token}`, () => {
      return new ProbotOctokit({

        // fallout from Probot@13 migration
        //
        // see https://github.com/probot/probot/pull/1874#issuecomment-1837779069
        log: {
          debug: log.debug.bind(log),
          info: log.info.bind(log),
          warn: log.warn.bind(log),
          error: log.error.bind(log)
        },
        auth: {
          token: access_token
        }
      });
    });

  }


  // api ////////////////////

  this.getAppScoped = githubApp.getAppScopedClient;

  this.getInstallationScoped = getInstallationScoped;

  this.getOrgScoped = getOrgScoped;

  this.getUserScoped = getUserScoped;


  // behavior ////////////////

  if (process.env.NODE_ENV !== 'test') {

    events.once('wuffle.start', function() {
      setInterval(() => {
        cache.evict();
      }, 1000 * 30);
    });
  }

}

module.exports = GitHubClient;