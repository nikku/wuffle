import { expect } from 'chai';
import { match } from 'sinon';

import { bootstrap } from '../../helpers/index.js';
import MockGithubIssues from '../../mocks/MockGithubIssues.js';
import MockIssueFilter from '../../mocks/MockIssueFilter.js';

import AutomaticDevFlowModule from '../../../lib/apps/automatic-dev-flow/index.js';

/**
 * @typedef {import('../../mocks/MockWebhookEvents.js').default} FakeWebhookEvents
 */


describe('apps/automatic-dev-flow', function() {

  let app;

  /**
   * @type { FakeWebhookEvents }
   */
  let webhookEvents;

  /**
   * @type { MockGithubIssues }
   */
  let githubIssues;

  /**
   * @type { MockIssueFilter }
   */
  let issueFilter;


  beforeEach(async function() {
    githubIssues = new MockGithubIssues();
    issueFilter = new MockIssueFilter();

    app = await bootstrap({
      additionalModules: [
        {
          githubIssues: [ 'value', githubIssues ],
          issueFilter: [ 'value', issueFilter ]
        },
        AutomaticDevFlowModule
      ]
    });

    webhookEvents = await app.get('webhookEvents');
  });


  describe('should handle GitHub updates', function() {

    it('issues.closed', async function() {

      // given
      const testIssue = issue({ state: 'closed' });

      // when
      await webhookEvents.emit({
        name: 'issues',
        payload: {
          action: 'closed',
          issue: testIssue,
          repository: repo()
        }
      });

      // then
      // issue moved to Done
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testIssue.number }),
        match({ name: 'Done' })
      );
    });


    it('pull_request.opened', async function() {

      // given
      const testPr = pullRequest();

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'opened',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // PR and referenced issues moved to Needs Review
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );
    });


    it('pull_request.opened (draft)', async function() {

      // given
      const testPr = pullRequest({ draft: true });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'opened',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // PR moved to In Progress (draft = WIP)
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'In Progress' })
      );

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'In Progress' })
      );
    });


    it('pull_request.opened (external)', async function() {

      // given
      // external = PR from a fork (different repo IDs)
      const testPr = pullRequest({
        base: { repo: { id: 1 } },
        head: { repo: { id: 2 } }
      });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'opened',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // external PR moved to Inbox (External Contribution)
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Inbox' })
      );

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Inbox' })
      );
    });


    it('pull_request.reopened', async function() {

      // given
      const testPr = pullRequest({ state: 'open' });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'reopened',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // PR moved to Needs Review on reopen
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );
    });


    it('pull_request.closed', async function() {

      // given
      const testPr = pullRequest({ state: 'closed' });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'closed',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // PR moved to Done
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Done' })
      );

      expect(githubIssues.moveReferencedIssues).to.not.have.been.called;
    });


    it('pull_request.edited', async function() {

      // given
      const testPr = pullRequest({
        labels: [ { name: 'needs review' } ]
      });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'edited',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // referenced issues re-evaluated for their column
      expect(githubIssues.moveIssue).to.not.have.been.called;

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );
    });


    it('pull_request.converted_to_draft', async function() {

      // given
      const testPr = pullRequest({ draft: true });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'converted_to_draft',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // PR and referenced issues moved to In Progress
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'In Progress' })
      );

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'In Progress' })
      );
    });


    it('pull_request.ready_for_review', async function() {

      // given
      const testPr = pullRequest({ draft: false });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'ready_for_review',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // PR and referenced issues moved to Needs Review
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );
    });


    it('pull_request.review_requested', async function() {

      // given
      const testPr = pullRequest({ draft: false });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'review_requested',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // PR and referenced issues moved to Needs Review
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'Needs Review' })
      );
    });


    it('pull_request.review_requested (draft)', async function() {

      // given
      // draft PRs are not moved when review is requested
      const testPr = pullRequest({ draft: true });

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'review_requested',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // no movement for draft PR
      expect(githubIssues.moveIssue).to.not.have.been.called;
      expect(githubIssues.moveReferencedIssues).to.not.have.been.called;
    });


    it('pull_request_review.submitted (changes_requested)', async function() {

      // given
      const testPr = pullRequest();

      // when
      await webhookEvents.emit({
        name: 'pull_request_review',
        payload: {
          action: 'submitted',
          pull_request: testPr,
          review: { state: 'changes_requested' },
          repository: repo()
        }
      });

      // then
      // PR and referenced issues moved back to In Progress
      expect(githubIssues.moveIssue).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'In Progress' })
      );

      expect(githubIssues.moveReferencedIssues).to.have.been.calledOnceWith(
        match.any,
        match({ number: testPr.number }),
        match({ name: 'In Progress' })
      );
    });


    it('pull_request_review.submitted (approved)', async function() {

      // given
      const testPr = pullRequest();

      // when
      await webhookEvents.emit({
        name: 'pull_request_review',
        payload: {
          action: 'submitted',
          pull_request: testPr,
          review: { state: 'approved' },
          repository: repo()
        }
      });

      // then
      // no movement for non-changes-requested review
      expect(githubIssues.moveIssue).to.not.have.been.called;
      expect(githubIssues.moveReferencedIssues).to.not.have.been.called;
    });


    it('create', async function() {

      // when
      // branch named after issue number
      await webhookEvents.emit({
        name: 'create',
        payload: {
          ref: '130-fix-bug',
          ref_type: 'branch',
          pusher_type: 'user',
          sender: { login: 'nikku' }
        }
      });

      // then
      // issue #130 moved to In Progress
      expect(githubIssues.findAndMoveIssue).to.have.been.calledOnceWith(
        match.any,
        130,
        match({ name: 'In Progress' }),
        'nikku',
        match.typeOf('function')
      );

      // only open issues are moved
      const filter = githubIssues.findAndMoveIssue.getCall(0).args[4];
      expect(filter({ state: 'open' })).to.be.true;
      expect(filter({ state: 'closed' })).to.be.false;
    });


    it('create (non-matching ref)', async function() {

      // when
      // branch name does NOT start with issue number
      await webhookEvents.emit({
        name: 'create',
        payload: {
          ref: 'feature-branch',
          ref_type: 'branch',
          pusher_type: 'user',
          sender: { login: 'nikku' }
        }
      });

      // then
      // no move triggered
      expect(githubIssues.findAndMoveIssue).to.not.have.been.called;
    });


    it('create (non-branch ref)', async function() {

      // when
      // tag creation (not a branch)
      await webhookEvents.emit({
        name: 'create',
        payload: {
          ref: 'v1.0.0',
          ref_type: 'tag',
          pusher_type: 'user',
          sender: { login: 'nikku' }
        }
      });

      // then
      // no move triggered
      expect(githubIssues.findAndMoveIssue).to.not.have.been.called;
    });

  });


  describe('should respect ignore filter', function() {

    it('should skip ignored pull request', async function() {

      // given
      // configure filter to ignore all PRs
      issueFilter.setIgnored(() => true);

      const testPr = pullRequest();

      // when
      await webhookEvents.emit({
        name: 'pull_request',
        payload: {
          action: 'opened',
          pull_request: testPr,
          repository: repo()
        }
      });

      // then
      // no movement for ignored PR
      expect(githubIssues.moveIssue).to.not.have.been.called;
      expect(githubIssues.moveReferencedIssues).to.not.have.been.called;
    });

  });

});


// helpers ////////////

function pullRequest(overrides = {}) {
  return {
    number: 131,
    title: 'Fix bug',
    state: 'open',
    draft: false,
    merged: false,
    merged_at: null,
    assignees: [],
    labels: [],
    user: {
      login: 'nikku',
      type: 'User'
    },
    base: {
      repo: { id: 1 }
    },
    head: {
      repo: { id: 1 }
    },
    body: '',
    ...overrides
  };
}

function issue(overrides = {}) {
  return {
    number: 130,
    title: 'Existing issue',
    state: 'open',
    assignees: [],
    labels: [],
    user: {
      login: 'nikku',
      type: 'User'
    },
    body: '',
    ...overrides
  };
}

function repo() {
  return {
    id: 1,
    name: 'test',
    owner: {
      login: 'nikku'
    }
  };
}
