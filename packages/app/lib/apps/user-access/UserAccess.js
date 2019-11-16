const {
  Cache
} = require('../../util');

// 30 minutes
const TTL = 1000 * 60 * 30;


/**
 * This component provides the functionality to filter
 * issues based on user views.
 *
 * @param {Logger} logger
 * @param {GitHubClient} githubClient
 * @param {Events} events
 */
function UserAccess(logger, githubClient, events) {

  const log = logger.child({
    name: 'wuffle:user-access'
  });

  const cache = new Cache(TTL);

  function getRepository(issue) {
    const {
      key,
      repository
    } = issue;

    if (!repository) {
      throw new Error(`missing repository meta-data for issue (key=${ key })`);
    }

    return repository;
  }

  async function fetchUserRepositories(token) {

    const github = await githubClient.getUserScoped(token);

    const installations = await github.paginate(
      github.apps.listInstallationsForAuthenticatedUser.endpoint.merge({}),
      res => res.data
    );

    const repositoriesByInstallation = await Promise.all(installations.map(
      installation => github.paginate(
        github.apps.listInstallationReposForAuthenticatedUser.endpoint.merge({
          installation_id: installation.id
        }),
        res => res.data
      )
    ));

    return [].concat(...repositoriesByInstallation);
  }

  function getUserVisibleRepositoryNames(token) {

    return cache.get(`user-repositories:${token}`, () => {
      return fetchUserRepositories(token);
    }).then(repositories => repositories.map(repo => {
      return repo.full_name;
    }));
  }

  /**
   * Show publicly accessible issues only.
   */
  function filterPublic(issue) {
    return !getRepository(issue).private;
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

      const repository = getRepository(issue);

      return fullName(repository) in repositoryMap;
    };
  }

  function createReadFilter(token) {

    const t = Date.now();

    log.debug({ token }, 'creating read filter');

    return getUserVisibleRepositoryNames(token).then(repositoryNames => {

      log.debug({
        token,
        repositories: repositoryNames
      }, 'creating member filter');

      return createMemberFilter(repositoryNames);
    }).finally(() => {
      log.info({ token, t: Date.now() - t }, 'created read filter');
    });

  }

  function getReadFilter(token) {

    if (!token) {
      return Promise.resolve(filterPublic);
    }

    return cache.get(token, createReadFilter).catch(err => {
      log.warn({ token }, 'failed to retrieve token-based access filter, defaulting to public read', err);

      return filterPublic;
    });
  }

  function canWrite(username, repoAndOwner) {

    const {
      repo,
      owner
    } = repoAndOwner;

    return githubClient.getOrgScoped(owner)
      .then(github => {
        return github.repos.getCollaboratorPermissionLevel({
          repo,
          owner,
          username
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
        log.warn('failed to determine write status', { username, owner, repo }, err);

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
      }, 1000 * 10);
    });
  }

}

module.exports = UserAccess;


// helpers //////////////

function fullName(repository) {
  return `${repository.owner.login}/${repository.name}`;
}