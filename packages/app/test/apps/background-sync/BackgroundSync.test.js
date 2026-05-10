import { expect } from 'chai';

import { bootstrap, expectIssue, expectNoIssue } from '../../helpers/index.js';

import BackgroundSyncModule from '../../../lib/apps/background-sync/index.js';

/**
 * @typedef { import('../../../lib/store.js').default } Store
 *
 * @typedef { import('../../../lib/apps/background-sync/BackgroundSyncBackend.js').default } BackgroundSyncBackend
 */


describe('apps/background-sync', function() {

  let app;

  /**
   * @type { Store }
   */
  let store;

  const installation = {
    id: 1,
    account: {
      login: 'owner'
    }
  };

  const repository = {
    id: 1,
    node_id: 'R_1',
    name: 'repo',
    'private': false,
    archived: false,
    owner: {
      id: 10,
      node_id: 'U_10',
      login: 'owner',
      avatar_url: '',
      html_url: '',
      type: 'User'
    },
    html_url: 'https://github.com/owner/repo'
  };

  const openIssue = {
    id: 1,
    number: 1,
    title: 'Open issue',
    body: '',
    state: 'open',
    state_reason: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    closed_at: null,
    assignees: [],
    labels: [],
    milestone: null,
    user: {
      id: 10,
      node_id: 'U_10',
      login: 'owner',
      avatar_url: '',
      html_url: '',
      type: 'User'
    }
  };

  const closedIssue = {
    id: 2,
    number: 2,
    title: 'Closed issue',
    body: '',
    state: 'closed',
    state_reason: 'completed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    closed_at: '2024-01-02T00:00:00Z',
    assignees: [],
    labels: [],
    milestone: null,
    user: {
      id: 10,
      node_id: 'U_10',
      login: 'owner',
      avatar_url: '',
      html_url: '',
      type: 'User'
    }
  };

  const openPull = {
    id: 3,
    number: 3,
    title: 'Open pull request',
    body: '',
    state: 'open',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    closed_at: null,
    merged_at: null,
    draft: false,
    assignees: [],
    requested_reviewers: [],
    labels: [],
    milestone: null,
    issue_url: 'https://api.github.com/repos/owner/repo/issues/3',
    user: {
      id: 10,
      node_id: 'U_10',
      login: 'owner',
      avatar_url: '',
      html_url: '',
      type: 'User'
    },
    head: {
      ref: 'feature',
      sha: 'abc123',
      user: {
        id: 10,
        node_id: 'U_10',
        login: 'owner',
        avatar_url: '',
        html_url: '',
        type: 'User'
      },
      repo: null
    },
    base: {
      ref: 'main',
      sha: 'def456',
      user: {
        id: 10,
        node_id: 'U_10',
        login: 'owner',
        avatar_url: '',
        html_url: '',
        type: 'User'
      },
      repo: null
    }
  };

  /**
   * @param {Object} options
   * @param {Array} [options.installations]
   * @param {Array} [options.repositories]
   * @param {Object} [options.issuesAndPullsByRepo]
   *
   * @return { BackgroundSyncBackend }
   */
  function createBackend({
    installations = [],
    repositories = [],
    issuesAndPullsByRepo = {}
  }) {

    return {

      getInstallations() {
        return Promise.resolve(installations);
      },

      getInstallationRepositories() {
        return Promise.resolve(repositories);
      },

      getRepositoryIssuesAndPulls(repository) {
        const key = `${repository.owner.login}/${repository.name}`;
        const {
          open_issues = [],
          closed_issues = [],
          open_pull_requests = [],
          closed_pull_requests = []
        } = issuesAndPullsByRepo[key] || {};

        return Promise.resolve({
          open_issues,
          closed_issues,
          open_pull_requests,
          closed_pull_requests
        });
      }
    };
  }

  beforeEach(async function() {
    app = await bootstrap({
      additionalModules: [
        BackgroundSyncModule,
        {
          backgroundSyncBackend: [ 'value', createBackend({
            installations: [ installation ],
            repositories: [ repository ],
            issuesAndPullsByRepo: {
              'owner/repo': {
                open_issues: [ openIssue ],
                closed_issues: [ closedIssue ],
                open_pull_requests: [ openPull ],
                closed_pull_requests: []
              }
            }
          }) ]
        }
      ]
    });

    store = await app.get('store');
  });


  describe('#backgroundSync', function() {

    it('should sync open issues', async function() {

      // given
      const backgroundSync = await app.get('backgroundSync');

      // when
      await backgroundSync.backgroundSync();

      // then
      expectIssue(store, {
        key: 'owner/repo#1',
        number: 1,
        title: 'Open issue',
        state: 'open',
        pull_request: false
      });
    });


    it('should sync closed issues', async function() {

      // given
      const backgroundSync = await app.get('backgroundSync');

      // when
      await backgroundSync.backgroundSync();

      // then
      expectIssue(store, {
        key: 'owner/repo#2',
        number: 2,
        title: 'Closed issue',
        state: 'closed',
        pull_request: false
      });
    });


    it('should sync open pull requests', async function() {

      // given
      const backgroundSync = await app.get('backgroundSync');

      // when
      await backgroundSync.backgroundSync();

      // then
      expectIssue(store, {
        key: 'owner/repo#3',
        number: 3,
        title: 'Open pull request',
        state: 'open',
        pull_request: true
      });
    });


    it('should skip archived repositories', async function() {

      // given
      const archivedRepo = { ...repository, id: 99, name: 'archived-repo', archived: true };

      app = await bootstrap({
        additionalModules: [
          BackgroundSyncModule,
          {
            backgroundSyncBackend: [ 'value', createBackend({
              repositories: [ archivedRepo ],
              issuesAndPullsByRepo: {
                'owner/archived-repo': {
                  open_issues: [ { ...openIssue, id: 99 } ]
                }
              }
            }) ]
          }
        ]
      });

      store = await app.get('store');
      const backgroundSync = await app.get('backgroundSync');

      // when
      await backgroundSync.backgroundSync();

      // then
      // no issues from archived repo synced
      expect(store.getIssues()).to.be.empty;
    });


    it('should remove expired issues not returned by sync', async function() {

      // given
      // issue already in store, last updated 61 days ago (past remove threshold)
      const staleUpdated = new Date(Date.now() - 1000 * 60 * 60 * 24 * 61).toISOString();
      await store.updateIssue({
        id: '1-99',
        key: 'owner/repo#99',
        number: 99,
        title: 'Stale issue',
        body: '',
        state: 'closed',
        pull_request: false,
        updated_at: staleUpdated,
        repository: {
          id: 1,
          name: 'repo',
          owner: { login: 'owner' }
        },
        labels: []
      });

      const backgroundSync = await app.get('backgroundSync');

      // when
      // sync returns only openIssue/closedIssue/openPull, not #99
      await backgroundSync.backgroundSync();

      // then
      expectNoIssue(store, { key: 'owner/repo#99' });
    });

  });

});
