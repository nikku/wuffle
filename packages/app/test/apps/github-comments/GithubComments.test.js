import { expect } from 'chai';

import { bootstrap } from '../../helpers/index.js';
import MockIssueFilter from '../../mocks/MockIssueFilter.js';

import GithubCommentsModule from '../../../lib/apps/github-comments/index.js';


describe('apps/github-comments', function() {

  /**
   * @typedef { import('../../mocks/MockWebhookEvents.js').default } MockWebhookEvents
   * @typedef { import('../../../lib/store.js').default } Store
   * @typedef { import('../../../lib/events.js').default } Events
   */

  let app;

  /**
   * @type { MockWebhookEvents }
   */
  let webhookEvents;

  /**
   * @type { Store }
   */
  let store;

  /**
   * @type { Store }
   */
  let events;

  /**
   * @type { MockIssueFilter }
   */
  let issueFilter;

  let githubCommentsBackend;

  const repository = {
    id: 1,
    node_id: 'R_1',
    name: 'repo',
    private: false,
    owner: {
      id: 10,
      node_id: 'U_10',
      login: 'owner',
      avatar_url: '',
      html_url: '',
      type: 'User',
      site_admin: false
    },
    html_url: 'https://github.com/owner/repo'
  };

  const issuePayload = {
    id: 429129893,
    node_id: 'I_1',
    number: 1,
    title: 'Test issue',
    state: 'open',
    state_reason: null,
    body: 'Test body',
    html_url: 'https://github.com/owner/repo/issues/1',
    url: 'https://api.github.com/repos/owner/repo/issues/1',
    user: {
      login: 'owner',
      id: 10,
      node_id: 'U_10',
      avatar_url: '',
      html_url: '',
      type: 'User',
      site_admin: false
    },
    labels: [],
    assignees: [],
    milestone: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    closed_at: null,
    author_association: 'OWNER'
  };

  // store ID as computed by getIdentifier(issue, repository) = `${repository.id}-${issue.number}`
  const issueId = `${repository.id}-${issuePayload.number}`;

  const storedIssue = {
    id: issueId,
    key: `${repository.owner.login}/${repository.name}#${issuePayload.number}`,
    number: issuePayload.number,
    title: issuePayload.title,
    state: 'open',
    state_reason: null,
    body: issuePayload.body,
    html_url: issuePayload.html_url,
    user: { login: 'owner', avatar_url: '', html_url: '', type: 'User' },
    created_at: issuePayload.created_at,
    updated_at: issuePayload.updated_at,
    closed_at: null,
    assignees: [],
    labels: [],
    milestone: null,
    pull_request: false,
    repository: {
      id: repository.id,
      node_id: repository.node_id,
      name: repository.name,
      owner: { login: repository.owner.login }
    }
  };

  const commentPayload = {
    id: 100,
    node_id: 'C_100',
    body: 'First comment',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    html_url: 'https://github.com/owner/repo/issues/1#issuecomment-100',
    author_association: 'OWNER',
    user: {
      login: 'alice',
      id: 20,
      node_id: 'U_20',
      avatar_url: 'https://github.com/alice.png',
      html_url: 'https://github.com/alice',
      type: 'User',
      site_admin: false
    }
  };

  // shape kept in store after filterComment() + filterUser()
  const filteredComment = {
    id: 100,
    node_id: 'C_100',
    body: 'First comment',
    created_at: '2024-01-02T00:00:00Z',
    html_url: 'https://github.com/owner/repo/issues/1#issuecomment-100',
    user: {
      id: 20,
      node_id: 'U_20',
      login: 'alice',
      avatar_url: 'https://github.com/alice.png',
      html_url: 'https://github.com/alice',
      type: 'User'
    }
  };


  beforeEach(async function() {
    issueFilter = new MockIssueFilter();
    githubCommentsBackend = {
      getIssueComments: async () => []
    };

    app = await bootstrap({
      additionalModules: [
        GithubCommentsModule,
        {
          issueFilter: [ 'value', issueFilter ],
          githubCommentsBackend: [ 'value', githubCommentsBackend ]
        }
      ]
    });

    events = await app.get('events');
    webhookEvents = await app.get('webhookEvents');
    store = await app.get('store');
  });


  describe('backgroundSync.sync', function() {

    it('should fetch and queue comment update', async function() {

      // given
      await store.updateIssue(storedIssue);

      githubCommentsBackend.getIssueComments = async (issue) => {

        // assume
        expect(issue.number).to.eql(storedIssue.number);

        return [ commentPayload ];
      };

      // when
      await events.emit('backgroundSync.sync', {
        issue: { ...storedIssue, repository }
      });

      // then
      const issue = store.getIssueById(issueId);
      expect(issue.comments).to.eql([ filteredComment ]);
    });


    it('should filter comment fields', async function() {

      // given
      await store.updateIssue(storedIssue);

      const rawComment = {
        ...commentPayload,
        extra_field: 'should be removed',
        user: {
          ...commentPayload.user,
          email: 'private@example.com'
        }
      };

      githubCommentsBackend.getIssueComments = async () => [ rawComment ];

      // when
      await events.emit('backgroundSync.sync', {
        issue: { ...storedIssue, repository }
      });

      // then
      const issue = store.getIssueById(issueId);
      expect(issue.comments[0]).to.not.have.property('extra_field');
      expect(issue.comments[0].user).to.not.have.property('email');
    });

  });


  describe('issue_comment webhook', function() {

    beforeEach(async function() {
      await store.updateIssue(storedIssue);
    });


    it('should add comment on created', async function() {

      // given / when
      await webhookEvents.emit({
        name: 'issue_comment',
        payload: {
          action: 'created',
          issue: issuePayload,
          comment: commentPayload,
          repository
        }
      });

      // then
      const issue = store.getIssueById(issueId);
      expect(issue.comments).to.eql([ filteredComment ]);
    });


    it('should append comment to existing on created', async function() {

      // given
      const existingComment = { ...filteredComment, id: 50, node_id: 'C_50' };
      await store.updateIssue({ ...storedIssue, comments: [ existingComment ] });

      // when
      await webhookEvents.emit({
        name: 'issue_comment',
        payload: {
          action: 'created',
          issue: issuePayload,
          comment: commentPayload,
          repository
        }
      });

      // then
      const issue = store.getIssueById(issueId);
      expect(issue.comments).to.have.length(2);
      expect(issue.comments).to.containSubset([ existingComment, filteredComment ]);
    });


    it('should remove comment on deleted', async function() {

      // given
      await store.updateIssue({ ...storedIssue, comments: [ filteredComment ] });

      // when
      await webhookEvents.emit({
        name: 'issue_comment',
        payload: {
          action: 'deleted',
          issue: issuePayload,
          comment: commentPayload,
          repository
        }
      });

      // then
      const issue = store.getIssueById(issueId);
      expect(issue.comments).to.be.empty;
    });


    it('should not modify comments on deleted when comment not found', async function() {

      // given
      const otherComment = { ...filteredComment, id: 50, node_id: 'C_50' };
      await store.updateIssue({ ...storedIssue, comments: [ otherComment ] });

      // when
      await webhookEvents.emit({
        name: 'issue_comment',
        payload: {
          action: 'deleted',
          issue: issuePayload,
          comment: commentPayload, // id 100, not present
          repository
        }
      });

      // then
      const issue = store.getIssueById(issueId);
      expect(issue.comments).to.eql([ otherComment ]);
    });


    it('should update existing comment on edited', async function() {

      // given
      await store.updateIssue({ ...storedIssue, comments: [ filteredComment ] });

      const updatedCommentPayload = { ...commentPayload, body: 'Updated body' };

      // when
      await webhookEvents.emit({
        name: 'issue_comment',
        payload: {
          action: 'edited',
          issue: issuePayload,
          comment: updatedCommentPayload,
          repository
        }
      });

      // then
      const issue = store.getIssueById(issueId);
      expect(issue.comments).to.have.length(1);
      expect(issue.comments[0].body).to.equal('Updated body');
    });


    it('should append comment on edited when not found', async function() {

      // given - no comments in store

      // when
      await webhookEvents.emit({
        name: 'issue_comment',
        payload: {
          action: 'edited',
          issue: issuePayload,
          comment: commentPayload,
          repository
        }
      });

      // then
      const issue = store.getIssueById(issueId);
      expect(issue.comments).to.eql([ filteredComment ]);
    });


    it('should ignore webhook for filtered issue', async function() {

      // given
      issueFilter.setIgnored(() => true);

      // when
      await webhookEvents.emit({
        name: 'issue_comment',
        payload: {
          action: 'created',
          issue: issuePayload,
          comment: commentPayload,
          repository
        }
      });

      // then
      // store issue unchanged, no comments added
      const issue = store.getIssueById(issueId);
      expect(issue.comments).to.not.exist;
    });

  });

});
