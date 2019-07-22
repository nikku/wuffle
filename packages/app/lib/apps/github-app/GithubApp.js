const PermissionLevels = {
  read: 1,
  write: 2,
  none: 0
};

const RequiredPermissions = {
  issues: 'write',
  pull_requests: 'write',
  contents: 'read',
  metadata: 'read'
};

const RequiredEvents = [
  'create',
  'issues',
  'issue_comment',
  'label',
  'milestone',
  'pull_request',
  'repository'
];


/**
 * This component validates and exposes
 * installations of the GitHub app.
 *
 * @param {Logger} logger
 * @param {GithubClient} githubClient
 */
function GithubApp(logger, githubClient) {

  const log = logger.child({
    name: 'wuffle:github-app'
  });

  /*
  app.on([
    'installation',
    'installation_repositories'
  ], async ({ payload }) => {

    console.log('installation update', payload);
  });
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

  async function fetchInstallations() {

    const github = await githubClient.getAppScoped();

    return github.paginate(
      github.apps.listInstallations.endpoint.merge({ per_page: 100 }),
      (response) => response.data
    );
  }


  // api ///////////////////

  this.getInstallations = function() {
    return fetchInstallations().then(installations => {

      validateInstallations(installations);

      return installations;
    });
  };

}

module.exports = GithubApp;