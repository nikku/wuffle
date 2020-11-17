const PermissionLevels = {
  read: 1,
  write: 2,
  none: 0
};

const RequiredPermissions = {
  checks: 'read',
  contents: 'read',
  issues: 'write',
  metadata: 'read',
  pull_requests: 'write',
  statuses: 'read'
};

const RequiredEvents = [
  'check_run',
  'create',
  'issues',
  'issue_comment',
  'label',
  'milestone',
  'pull_request',
  'pull_request_review',
  'repository',
  'status'
];

/**
 * @typedef {import('@octokit/rest').Octokit.AppsListInstallationsResponseItem} Installation
 */

/**
 * This component validates and exposes
 * installations of the GitHub app.
 *
 * @param {Object} config
 * @param {import("../../types").ProbotApp} app
 * @param {import("../../types").Logger} logger
 * @param {import("../../types").Injector} injector
 */
function GithubApp(config, app, logger, injector) {

  const log = logger.child({
    name: 'wuffle:github-app'
  });

  const {
    allowedOrgs
  } = config;

  // cached data //////////////////

  let installations = null;
  let installationsByLogin = null;
  let installationsById = null;

  // reactivity ////////////////////

  injector.get('webhookEvents').then(webhookEvents => {
    webhookEvents.on('installation', () => {
      installations = null;
      installationsByLogin = null;
      installationsById = null;
    });
  });


  // functionality /////////////////

  function getAppScopedClient() {
    return app.auth();
  }

  function getInstallations() {
    installations = installations || fetchInstallations().then(installations => {

      const enabledInstallations = installations.filter(i => isLoginEnabled(i.account.login));

      validateInstallations(enabledInstallations);

      return enabledInstallations;
    });

    return installations;
  }

  function getInstallationsById() {

    installationsById = installationsById || getInstallations().then(
      installations => installations.reduce((byId, installation) => {
        byId[installation.id] = installation;

        return byId;
      }, {})
    );

    return installationsById;
  }

  /**
   * Get an installation for the given id.
   *
   * @param {string} id
   *
   * @return {Promise<Installation?>}
   */
  function getInstallationById(id) {
    return getInstallationsById().then(byId => {
      return byId[id];
    });
  }

  /**
   * Return map of installations, grouped by org / login.
   *
   * @return {Promise<Object<String, Installation>>}
   */
  function getInstallationsByLogin() {

    installationsByLogin = installationsByLogin || getInstallations().then(
      installations => installations.reduce((byLogin, installation) => {
        byLogin[installation.account.login] = installation;

        return byLogin;
      }, {})
    );

    return installationsByLogin;
  }

  /**
   * Get an installation for the given login.
   *
   * This method throws if an installation for the given login does not exist.
   *
   * @param {string} login
   *
   * @return {Promise<Installation>}
   */
  function getInstallationByLogin(login) {
    return getInstallationsByLogin().then(byLogin => {
      const installation = byLogin[login];

      if (!installation) {
        throw new Error('not installed for ' + login);
      }

      return installation;
    });
  }

  function isInstallationEnabled(installation) {

    const {
      id: installation_id
    } = installation;

    return getInstallationById(installation_id).then(installation => !!installation);
  }

  function isLoginEnabled(login) {
    if (allowedOrgs) {
      return allowedOrgs.some(org => org === login);
    }

    return true;
  }

  function isRequiredLevel(requested, actual) {
    return PermissionLevels[requested] <= PermissionLevels[actual || 'none'];
  }

  function validateInstallation(installation) {

    const {
      account,
      permissions,
      events
    } = installation;

    const {
      login
    } = account;

    const missingPermissions = Object.entries(RequiredPermissions).filter(
      ([ permission, requestedLevel ]) => {
        const actualLevel = permissions[permission];

        return !isRequiredLevel(actualLevel, requestedLevel);
      }
    );

    const missingEvents = RequiredEvents.filter(
      (event) => !events.includes(event)
    );

    if (missingPermissions.length) {
      log.warn({
        installation: login,
        permissions
      }, 'missing required permissions', missingPermissions);
    }

    if (missingEvents.length) {
      log.warn({
        installation: login,
        events
      }, 'missing required event subscriptions', missingEvents);
    }

  }

  function validateInstallations(installations) {
    log.debug('validate installations');

    installations.map(validateInstallation);

    log.debug('validated installations');
  }

  /**
   * Fetch active installations.
   *
   * @return {Promise<Array<Installation>>} installations
   */
  function fetchInstallations() {
    return getAppScopedClient().then(
      github => github.paginate(
        github.apps.listInstallations.endpoint.merge({ per_page: 100 }),
        (response) => response.data
      )
    );
  }

  // api ///////////////////

  this.getAppScopedClient = getAppScopedClient;

  this.isInstallationEnabled = isInstallationEnabled;

  this.getInstallationByLogin = getInstallationByLogin;
  this.getInstallationById = getInstallationById;

  this.getInstallations = getInstallations;

}

module.exports = GithubApp;