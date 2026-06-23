import fs from 'node:fs';

import { bootstrap, expectIssue, expectNoIssue } from '../../helpers/index.js';
import EventsSyncModule from '../../../lib/apps/events-sync/index.js';

/**
 * @typedef {import('../../mocks/MockWebhookEvents.js').default } MockWebhookEvents
 * @typedef {import('../../../lib/store.js').default } Store
 */


describe('apps/events-sync', function() {

  let app;

  /**
   * @type { MockWebhookEvents }
   */
  let webhookEvents;

  /**
   * @type { Store }
   */
  let store;

  beforeEach(async function() {
    app = await bootstrap({
      additionalModules: [
        EventsSyncModule
      ]
    });

    webhookEvents = await app.get('webhookEvents');

    store = await app.get('store');
  });


  describe('should handle GitHub updates', function() {

    it('issues.opened', async function() {

      // when
      await webhookEvents.emit(
        event('00-issues.opened')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        closed_at: null,
        pull_request: false,
        state: 'open',
        state_reason: null,
        milestone: null
      });
    });


    it('issues.closed', async function() {

      // when
      await webhookEvents.emit(
        event('01-issues.closed')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        closed_at: '2026-05-09T05:59:56Z',
        pull_request: false,
        state: 'closed',
        state_reason: 'completed',
        milestone: null
      });
    });


    it('issues.reopened', async function() {

      // when
      await webhookEvents.emit(
        event('02-issues.reopened')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        closed_at: null,
        updated_at: '2026-05-09T06:00:05Z',
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: null
      });
    });


    it('issues.labeled', async function() {

      // when
      await webhookEvents.emit(
        event('03-issues.labeled')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          },
          {
            name: 'wontfix',
            color: 'ffffff'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        closed_at: null,
        updated_at: '2026-05-09T06:00:12Z',
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: null
      });
    });


    it('issues.unlabeled', async function() {

      // when
      await webhookEvents.emit(
        event('04-issues.unlabeled')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        closed_at: null,
        updated_at: '2026-05-09T06:00:17Z',
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: null
      });
    });


    it('issues.milestoned', async function() {

      // when
      await webhookEvents.emit(
        event('05-issues.milestoned')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        closed_at: null,
        updated_at: '2026-05-09T06:00:21Z',
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: {
          number: 1,
          state: 'open',
          title: 'First'
        }
      });
    });


    it('issues.demilestoned', async function() {

      // when
      await webhookEvents.emit(
        event('06-issues.demilestoned')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        closed_at: null,
        updated_at: '2026-05-09T06:00:28Z',
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: null
      });
    });


    it('issues.assigned', async function() {

      // when
      await webhookEvents.emit(
        event('07-issues.assigned')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [
          {
            login: 'nikku',
            type: 'User'
          }
        ],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        updated_at: '2026-05-09T06:00:31Z',
        closed_at: null,
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: null
      });
    });


    it('issues.unassigned', async function() {

      // when
      await webhookEvents.emit(
        event('08-issues.unassigned')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        updated_at: '2026-05-09T06:00:37Z',
        closed_at: null,
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: null
      });
    });


    it('issues.edited', async function() {

      // given
      await webhookEvents.emit(
        event('00-issues.opened')
      );

      // when
      // issue body changes
      await webhookEvents.emit(
        event('09-issues.edited')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        body: 'A problem. Really.',
        updated_at: '2026-05-09T06:00:53Z'
      });
    });


    it('issue_comment.created', async function() {

      // when
      await webhookEvents.emit(
        event('10-issue_comment.created')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem. Really.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        updated_at: '2026-05-09T06:01:14Z',
        closed_at: null,
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: null
      });
    });


    it('issue_comment.edited', async function() {

      // when
      await webhookEvents.emit(
        event('11-issue_comment.edited')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        number: 130,
        repository: {
          name: 'testtest'
        },
        body: 'A problem. Really.',
        title: 'New issue',
        assignees: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          }
        ],
        created_at: '2026-05-09T05:59:45Z',
        updated_at: '2026-05-09T06:01:14Z',
        closed_at: null,
        pull_request: false,
        state: 'open',
        state_reason: 'reopened',
        milestone: null
      });
    });


    it('milestone.edited', async function() {

      // given
      // issue milestoned with milestone #1
      await webhookEvents.emit(
        event('05-issues.milestoned')
      );

      // when
      await webhookEvents.emit(
        event('12-milestone.edited')
      );

      // then
      // issue milestone updated
      expectIssue(store, {
        key: 'nikku/testtest#130',
        milestone: {
          number: 1,
          state: 'open',
          title: 'First - 1'
        }
      });
    });


    it('label.edited', async function() {

      // given
      await webhookEvents.emit(
        event('03-issues.labeled')
      );

      // when
      await webhookEvents.emit(
        event('13-label.edited')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#130',
        labels: [
          {
            name: 'bug',
            color: 'fc2929'
          },
          {
            name: 'wontfix',
            color: 'aaaaaa'
          }
        ]
      });
    });


    it('label.deleted + issues.unlabeled', async function() {

      // given
      // issue 80 has foo:bar label before the events
      await store.updateIssue({
        id: '150751504-80',
        key: 'nikku/testtest#80',
        number: 80,
        title: 'EPIC',
        repository: {
          id: 150751504,
          name: 'testtest',
          owner: {
            login: 'nikku'
          }
        },
        labels: [
          { id: 1389374253, name: 'foo:bar', color: 'fcbfb5' },
          { id: 1072681313, name: 'enhancement', color: 'a2eeef' },
          { id: 1334379678, name: 'backlog', color: 'ededed' }
        ]
      });

      // when
      await webhookEvents.emit(
        event('14-label.deleted')
      );

      await webhookEvents.emit(
        event('14-issues.unlabeled')
      );

      // then
      // foo:bar label removed, issue updated
      expectIssue(store, {
        key: 'nikku/testtest#80',
        number: 80,
        labels: [
          {
            name: 'enhancement',
            color: 'a2eeef'
          },
          {
            name: 'backlog',
            color: 'ededed'
          }
        ]
      });
    });


    it('issues.transferred + issues.deleted', async function() {

      // given
      // issue #130 is in the store
      await webhookEvents.emit(
        event('00-issues.opened')
      );

      // when
      await webhookEvents.emit(
        event('15-issues.transferred')
      );

      await webhookEvents.emit(
        event('15-issues.deleted')
      );

      // then
      // issue #130 is removed
      expectNoIssue(store, {
        key: 'nikku/testtest#130'
      });
    });


    it('pull_request.opened', async function() {

      // when
      await webhookEvents.emit(
        event('20-pull_request.opened')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        number: 131,
        repository: {
          name: 'testtest'
        },
        title: 'update README',
        assignees: [],
        requested_reviewers: [],
        user: {
          login: 'nikku',
          type: 'User'
        },
        labels: [],
        created_at: '2026-05-09T19:07:03Z',
        updated_at: '2026-05-09T19:07:03Z',
        closed_at: null,
        pull_request: true,
        state: 'open',
        draft: false,
        merged: false,
        milestone: null,
        head: {
          ref: 'nikku-patch-11'
        },
        base: {
          ref: 'master'
        }
      });
    });


    it('pull_request.closed', async function() {

      // when
      await webhookEvents.emit(
        event('21-pull_request.closed')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        state: 'closed',
        closed_at: '2026-05-09T19:07:20Z',
        merged: false,
        labels: [
          {
            name: 'needs review',
            color: 'ededed'
          }
        ]
      });
    });


    it('pull_request.reopened', async function() {

      // when
      await webhookEvents.emit(
        event('24-pull_request.reopened')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        state: 'open',
        closed_at: null,
        updated_at: '2026-05-09T19:07:26Z',
        labels: []
      });
    });


    it('pull_request.labeled', async function() {

      // when
      await webhookEvents.emit(
        event('20-pull_request.labeled')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        labels: [
          {
            name: 'needs review',
            color: 'ededed'
          }
        ],
        updated_at: '2026-05-09T19:07:07Z'
      });
    });


    it('pull_request.unlabeled', async function() {

      // when
      await webhookEvents.emit(
        event('21-pull_request.unlabeled')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        state: 'closed',
        labels: [],
        updated_at: '2026-05-09T19:07:22Z'
      });
    });


    it('pull_request.assigned', async function() {

      // when
      await webhookEvents.emit(
        event('25-pull_request.assigned')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        assignees: [
          {
            login: 'nikku',
            type: 'User'
          }
        ],
        updated_at: '2026-05-09T19:07:33Z'
      });
    });


    it('pull_request.unassigned', async function() {

      // when
      await webhookEvents.emit(
        event('26-pull_request.unassigned')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        assignees: [],
        updated_at: '2026-05-09T19:07:38Z'
      });
    });


    it('pull_request.milestoned', async function() {

      // when
      await webhookEvents.emit(
        event('27-pull_request.milestoned')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        milestone: {
          number: 1,
          title: 'First',
          state: 'open'
        },
        updated_at: '2026-05-09T19:07:46Z'
      });
    });


    it('pull_request.demilestoned', async function() {

      // when
      await webhookEvents.emit(
        event('28-pull_request.demilestoned')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        milestone: null,
        updated_at: '2026-05-09T19:12:48Z'
      });
    });


    it('pull_request.review_requested', async function() {

      // when
      await webhookEvents.emit(
        event('29-pull_request.review_requested')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        requested_reviewers: [
          {
            login: 'waltaaa',
            type: 'User'
          }
        ],
        updated_at: '2026-05-09T19:07:57Z'
      });
    });


    it('pull_request.review_request_removed', async function() {

      // when
      await webhookEvents.emit(
        event('30-pull_request.review_request_removed')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        requested_reviewers: [],
        updated_at: '2026-05-09T19:08:09Z'
      });
    });


    it('pull_request.synchronize', async function() {

      // when
      await webhookEvents.emit(
        event('31-pull_request.synchronize')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        state: 'open',
        updated_at: '2026-05-09T19:08:29Z'
      });
    });


    it('pull_request.edited', async function() {

      // given
      await webhookEvents.emit(
        event('20-pull_request.opened')
      );

      // when
      await webhookEvents.emit(
        event('32-pull_request.edited')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        updated_at: '2026-05-09T19:08:52Z'
      });
    });


    it('pull_request.converted_to_draft', async function() {

      // when
      await webhookEvents.emit(
        event('33-pull_request.converted_to_draft')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        draft: true,
        state: 'open',
        updated_at: '2026-05-09T19:09:04Z'
      });
    });


    it('pull_request.ready_for_review', async function() {

      // when
      await webhookEvents.emit(
        event('34-pull_request.ready_for_review')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        draft: false,
        state: 'open',
        updated_at: '2026-05-09T19:09:13Z',
        labels: [
          {
            name: 'in progress',
            color: 'adcc41'
          }
        ]
      });
    });


    it('sub_issues.sub_issue_added', async function() {

      // when
      await webhookEvents.emit(
        event('16-sub_issues.sub_issue_added')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        number: 131,
        title: 'Sub issue',
        repository: {
          name: 'testtest'
        },
        pull_request: false,
        state: 'open',
        parent_issue_url: 'https://api.github.com/repos/nikku/testtest/issues/130'
      });
    });


    it('sub_issues.sub_issue_removed', async function() {

      // given
      await webhookEvents.emit(
        event('16-sub_issues.sub_issue_added')
      );

      // when
      await webhookEvents.emit(
        event('17-sub_issues.sub_issue_removed')
      );

      // then
      expectIssue(store, {
        key: 'nikku/testtest#131',
        parent_issue_url: null
      });
    });

  });

});


// helpers ////////////

function event(name) {
  const url = new URL('./fixtures/' + name + '.json', import.meta.url);

  const contents = fs.readFileSync(url, { encoding: 'utf8' });

  return JSON.parse(contents);
}