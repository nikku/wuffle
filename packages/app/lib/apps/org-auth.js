
/**
 * This app offers the App#orgAuth(login) method to get an
 * authenticated GitHub client for the given login or organization.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  const log = app.log.child({
    name: 'wuffle:org-auth'
  });

  // cached data ///////////////////

  let authByLogin = {};

  let installationsByLogin = null;


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

  function orgAuth(login) {

    let auth = authByLogin[login];

    if (auth) {
      return auth;
    }

    log.info({ login }, 'fetching auth');

    auth = authByLogin[login] =
      getInstallationByLogin(login)
        .then(
          installation => app.auth(installation.id),
          error => {
            log.error({ login }, 'failed to authenticate', error);
            throw error;
          }
        );

    return auth;
  }

  // TODO: nikku periodically expire installations / authByLogin

  // https://developer.github.com/v3/activity/events/types/#installationevent
  app.on('installation', () => {

    log.debug('installations update, resetting cache');

    // expire cached entries
    installationsByLogin = null;
    authByLogin = {};
  });


  // public API ///////////////////////

  app.orgAuth = orgAuth;
};