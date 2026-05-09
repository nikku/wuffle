import { expect } from 'chai';

import { bootstrap, expectIssue, expectNoIssue } from '../../helpers/index.js';
import ReindexStoreModule from '../../../lib/apps/reindex-store/index.js';

/**
 * @typedef { import('../../../lib/events.js').default } Events
 * @typedef { import('../../../lib/store.js').default } Store
 */


describe('apps/reindex-store', function() {

  let app;

  /**
   * @type { Events }
   */
  let events;

  /**
   * @type { Store }
   */
  let store;

  beforeEach(async function() {
    app = await bootstrap({
      additionalModules: [
        ReindexStoreModule
      ]
    });

    events = await app.get('events');
    store = await app.get('store');
  });


  describe('store.restored', function() {

    it('should reindex on config change', async function() {

      // given
      // closed issue wrongly placed in Inbox
      await store.updateIssue(issue({
        id: '1-1',
        key: 'owner/repo#1',
        state: 'closed',
        column: 'Inbox'
      }));

      // when
      await events.emit('store.restored', {
        data: { configHash: 'old-config-hash' }
      });

      // then
      // column re-computed to Done
      expectIssue(store, {
        key: 'owner/repo#1',
        column: 'Done'
      });
    });


    it('should re-compute order', async function() {

      // given
      // issue A correctly in Done with order 500
      await store.updateIssue(issue({
        id: '1-1',
        key: 'owner/repo#1',
        state: 'closed',
        column: 'Done',
        order: 500
      }));

      // issue B closed, but wrongly placed in Inbox with order 2000
      await store.updateIssue(issue({
        id: '1-2',
        key: 'owner/repo#2',
        state: 'closed',
        column: 'Inbox',
        order: 2000
      }));

      // when
      await events.emit('store.restored', {
        data: { configHash: 'old-config-hash' }
      });

      // then
      const issues = store.getIssues();
      const issueA = issues.find(i => i.key === 'owner/repo#1');
      const issueB = issues.find(i => i.key === 'owner/repo#2');

      // B moved to Done
      expect(issueB.column).to.equal('Done');

      // B order re-computed to be before A (lower order)
      expect(issueB.order).to.be.lessThan(issueA.order);
    });


    it('should re-apply ignore filter', async function() {

      // given
      await store.updateIssue(issue({
        id: '1-1',
        key: 'owner/repo#1'
      }));

      await store.updateIssue(issue({
        id: '1-2',
        key: 'owner/repo#2',
        number: 2
      }));

      store.setIgnoreFilter(i => i.key === 'owner/repo#1');

      // when
      await events.emit('store.restored', {
        data: { configHash: 'old-config-hash' }
      });

      // then - filtered issue removed, other preserved
      expectNoIssue(store, { key: 'owner/repo#1' });
      expectIssue(store, { key: 'owner/repo#2' });
    });


    it('should not reindex when config unchanged', async function() {

      // given
      // closed issue wrongly placed in Inbox
      await store.updateIssue(issue({
        id: '1-1',
        key: 'owner/repo#1',
        state: 'closed',
        column: 'Inbox'
      }));

      // capture the current config hash via the serialize event
      const data = {};
      await events.emit('store.serialize', { data });
      const { configHash } = data;

      // when
      await events.emit('store.restored', {
        data: { configHash }
      });

      // then
      // no reindex, column stays wrong
      expectIssue(store, {
        key: 'owner/repo#1',
        column: 'Inbox'
      });
    });

  });

});


// helpers ////////////

/**
 * @param { Partial<{ id: string, key: string, number: number, state: string, column: string, order: number }> } overrides
 */
function issue(overrides = {}) {
  return {
    id: '1-1',
    key: 'owner/repo#1',
    number: 1,
    title: 'Issue',
    body: '',
    repository: {
      id: 1,
      name: 'repo',
      owner: {
        login: 'owner'
      }
    },
    state: 'open',
    labels: [],
    ...overrides
  };
}
