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
  'member',
  'milestone',
  'pull_request',
  'pull_request_review',
  'repository',
  'status',
  'sub_issues'
];

/**
 * @typedef {import('./types.js').Installation} Installation
 * @typedef {import('../../types.js').Octokit} Octokit
 */

/**
 * This component validates and exposes
 * installations of the GitHub app.
 *
 * @constructor
 *
 * @param {Object} config
 * @param {import('../../types.js').ProbotApp} app
 * @param {import('../../types.js').Logger} logger
 * @param {import('../../types.js').Injector} injector
 * @param {import('../../events.js').default} events
 */
export default function GithubApp(config, app, logger, injector, events) {

  const log = logger.child({
    name: 'wuffle:github-app'
  });

  const {
    allowedOrgs
  } = config;

  // cached data //////////////////

  /**
   * @type {Promise<Installation[]> | null}
   */
  let installations = null;

  /**
   * @type {Promise<Record<string, Installation>> | null}
   */
  let installationsByLogin = null;

  /**
   * @type {Promise<Record<string, Installation>> | null}
   */
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

  /**
   * @return {Promise<Octokit>}
   */
  function getAppScopedClient() {
    return app.auth();
  }

  /**
   * Return installations
   *
   * @return {Promise<Installation[]>}
   */
  function getInstallations() {
    installations = installations || fetchInstallations().then(installations => {

      const enabledInstallations = installations.filter(i => isLoginEnabled(i.account.login));

      validateInstallations(enabledInstallations);

      return enabledInstallations;
    });

    return installations;
  }

  /**
   * Return installations by ID
   *
   * @return {Promise<Record<string, Installation>>}
   */
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
   * @param {string|number} id
   *
   * @return {Promise<Installation | undefined>}
   */
  function getInstallationById(id) {
    return getInstallationsById().then(byId => {
      return byId[id];
    });
  }

  /**
   * Return map of installations, grouped by org / login.
   *
   * @return {Promise<Record<string, Installation>>}
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

  /**
   * Return true if installation is enabled.
   *
   * @param {Installation} installation
   *
   * @return {Promise<boolean>}
   */
  function isInstallationEnabled(installation) {

    const {
      id: installation_id
    } = installation;

    return getInstallationById(installation_id).then(installation => !!installation);
  }

  /**
   * @param {string} login
   *
   * @return {boolean}
   */
  function isLoginEnabled(login) {
    if (allowedOrgs) {
      return allowedOrgs.some(org => org === login);
    }

    return true;
  }

  /**
   * @param {string} requested
   * @param {string} actual
   *
   * @return {boolean}
   */
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
        permissions,
        missingPermissions
      }, 'missing required permissions');
    }

    if (missingEvents.length) {
      log.warn({
        installation: login,
        events,
        missingEvents
      }, 'missing required event subscriptions');
    }

  }

  function validateInstallations(installations) {
    log.debug('validate installations');

    installations.map(validateInstallation);

    log.debug('validated installations');
  }

  async function validateApp() {
    const octokit = await getAppScopedClient();
    const { data: app } = await octokit.rest.apps.getAuthenticated();

    // app may not be configured yet
    if (!app) {
      return;
    }

    const missingEvents = RequiredEvents.filter(
      event => !app.events.includes(event)
    );

    if (missingEvents.length) {
      log.error({
        missingEvents,
        events: app.events
      }, 'app is missing required event subscriptions; update app settings on GitHub');
    }
  }

  events.once('wuffle.start', async function() {
    await validateApp().catch(err => log.warn({ err }, 'failed to validate app configuration'));
  });

  /**
   * Fetch active installations.
   *
   * @return {Promise<Installation[]>} installations
   */
  function fetchInstallations() {
    return /** @type Promise<Installation[]> */ (getAppScopedClient().then(
      octokit => octokit.paginate(
        octokit.rest.apps.listInstallations,
        { per_page: 100 }
      )
    ));
  }

  // api ///////////////////

  /**
   * Return an application-scoped octokit client.
   *
   * @return {Promise<Octokit>}
   */
  this.getAppScopedClient = getAppScopedClient;

  /**
   * Return true if installation is enabled.
   *
   * @param {Installation} installation
   *
   * @return {Promise<boolean>}
   */
  this.isInstallationEnabled = isInstallationEnabled;

  /**
   * Get an installation for the given login.
   *
   * This method throws if an installation for the given login does not exist.
   *
   * @param {string} login
   *
   * @return {Promise<Installation>}
   */
  this.getInstallationByLogin = getInstallationByLogin;

  /**
   * Get an installation for the given id.
   *
   * @param {string|number} id
   *
   * @return {Promise<Installation | undefined>}
   */
  this.getInstallationById = getInstallationById;

  /**
   * Return installations
   *
   * @return {Promise<Installation[]>}
   */
  this.getInstallations = getInstallations;

}