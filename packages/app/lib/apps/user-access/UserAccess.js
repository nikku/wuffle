const TreeCache = require('./TreeCache');

// 9 days
const TTL = 1000 * 60 * 60 * 24 * 9;


/**
 * This component provides the functionality to filter
 * issues based on user views.
 *
 * @param {import("../../types").Logger} logger
 * @param {import("../github-client/GithubClient")} githubClient
 * @param {import("../../events")} events
 * @param {import("../webhook-events/WebhookEvents")} webhookEvents
 */
function UserAccess(logger, githubClient, events, webhookEvents) {

  const log = logger.child({
    name: 'wuffle:user-access'
  });

  const cache = new TreeCache(TTL);

  function getIssueRepository(issue) {
    const {
      key,
      repository
    } = issue;

    if (!repository) {
      throw new Error(`missing repository meta-data for issue (key=${ key })`);
    }

    return repository;
  }

  async function fetchUserInstallations(user) {

    const github = await githubClient.getUserScoped(user);

    return github.paginate(
      github.apps.listInstallationsForAuthenticatedUser.endpoint.merge({}),
      res => res.data
    );
  }

  async function fetchUserRepositories(user) {
    const installations = await getUserInstallations(user);

    const repositoriesByInstallation = await Promise.all(
      installations.map(installation => getUserRepositoriesForInstallation(user, installation))
    );

    return [].concat(...repositoriesByInstallation);
  }

  async function fetchUserRepositoriesForInstallation(user, installation) {

    const github = await githubClient.getUserScoped(user);

    return await github.paginate(
      github.apps.listInstallationReposForAuthenticatedUser.endpoint.merge({
        installation_id: installation.id
      }),
      res => res.data.repositories || res.data
    );
  }

  function getUserRepositoriesForInstallation(user, installation) {

    return cache.get(`login=${user.login}:installation_repositories=${installation.id}`, () => {
      return fetchUserRepositoriesForInstallation(user, installation);
    });
  }

  function getUserInstallations(user) {

    return cache.get(`login=${user.login}:installations`, () => {
      return fetchUserInstallations(user);
    });

  }

  function getUserRepositories(user) {

    return cache.get(`login=${user.login}:repositories`, () => {
      return fetchUserRepositories(user);
    });
  }

  function getUserVisibleRepositoryNames(user) {
    return getUserRepositories(user).then(repositories => repositories.map(repo => {
      return repo.full_name;
    }));
  }

  /**
   * Show publicly accessible issues only.
   */
  function filterPublic(issue) {
    return !getIssueRepository(issue).private;
  }

  /**
   * Filter issues and PRs that are member of the given
   * repositories.
   */
  async function createMemberFilter(repositories) {

    const repositoryMap = repositories.reduce((map, repo) => {

      map[repo] = true;

      return map;
    }, {});

    return function filterPrivate(issue) {

      if (filterPublic(issue)) {
        return true;
      }

      const repository = getIssueRepository(issue);

      return fullName(repository) in repositoryMap;
    };
  }

  function createReadFilter(user) {

    const {
      login
    } = user;

    const t = Date.now();

    log.debug({ login }, 'creating read filter');

    return getUserVisibleRepositoryNames(user).then(repositoryNames => {

      log.debug({
        login,
        repositories: repositoryNames
      }, 'creating member filter');

      return createMemberFilter(repositoryNames);
    }).finally(() => {
      log.info({ login, t: Date.now() - t }, 'created read filter');
    });

  }

  function getReadFilter(user) {

    if (!user) {
      return Promise.resolve(filterPublic);
    }

    const {
      login
    } = user;

    return cache.get(`login=${login}:read_filter`, () => createReadFilter(user));
  }

  function canWrite(user, repoAndOwner) {

    const {
      login
    } = user;

    const {
      repo,
      owner
    } = repoAndOwner;

    return githubClient.getOrgScoped(owner)
      .then(github => {
        return github.repos.getCollaboratorPermissionLevel({
          repo,
          owner,
          username: login
        });
      }).then(res => {
        const {
          permission
        } = res.data;

        return (
          permission === 'write' ||
          permission === 'admin'
        );
      }).catch(err => {
        log.warn('failed to determine write status', { login, owner, repo }, err);

        return false;
      });
  }


  // api ////////////////////

  this.getReadFilter = getReadFilter;

  this.canWrite = canWrite;


  // behavior ///////////////

  if (process.env.NODE_ENV !== 'test') {

    events.once('wuffle.start', function() {
      setInterval(() => {
        cache.evict();
      }, 1000 * 60 * 15);
    });
  }


  // https://developer.github.com/v3/activity/events/types/#githubappauthorizationevent

  webhookEvents.on([
    'github_app_authorization.revoked'
  ], (context) => {

    const {
      sender: {
        login
      }
    } = context.payload;

    cache.invalidate(`login=${login}:*`);
  });


  // https://developer.github.com/v3/activity/events/types/#installationrepositoriesevent

  webhookEvents.on([
    'installation_repositories.added',
    'installation_repositories.removed'
  ], function(context) {

    const {
      installation: {
        id: installation_id
      }
    } = context.payload;

    const installationMatches = cache.match('login=*:installations');

    for (const match of installationMatches) {

      const {
        match: [ login ],
        value: installations
      } = match;

      const isInstallationMember = installations.find(
        installation => installation.id === installation_id
      );

      if (isInstallationMember) {
        cache.invalidate(`login=${login}:installation_repositories=${installation_id}`);
        cache.invalidate(`login=${login}:repositories`);
        cache.invalidate(`login=${login}:read_filter`);
      }
    }
  });


  // https://developer.github.com/v3/activity/events/types/#installationevent

  webhookEvents.on([
    'installation.created',
    'installation.deleted'
  ], function(context) {

    cache.invalidate('login=*:installations');
    cache.invalidate('login=*:installation_repositories=*');
    cache.invalidate('login=*:repositories');
    cache.invalidate('login=*:read_filter');
  });


  // https://developer.github.com/v3/activity/events/types/#memberevent

  webhookEvents.on([
    'member'
  ], function(context) {

    const {
      member: {
        login
      }
    } = context.payload;

    cache.invalidate(`login=${login}:installations`);
    cache.invalidate(`login=${login}:installation_repositories=*`);
    cache.invalidate(`login=${login}:repositories`);
    cache.invalidate(`login=${login}:read_filter`);
  });

}

module.exports = UserAccess;


// helpers //////////////

function fullName(repository) {
  return `${repository.owner.login}/${repository.name}`;
}