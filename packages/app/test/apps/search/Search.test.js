import { expect } from 'chai';

import Search from 'wuffle/lib/apps/search/Search.js';

import { LinkTypes } from 'wuffle/lib/links.js';

function createSearch() {

  const logger = {
    child() { return this; },
    warn() {},
    info() {},
    debug() {}
  };

  const store = {
    getIssueByKey() { return null; },
    getIssueLinks() { return []; }
  };

  // @ts-ignore-error mocked logger, store
  return new Search({}, logger, store);
}


function createIssue(overrides = {}) {
  return {
    number: 1,
    title: 'Test issue',
    state: 'open',
    assignees: [],
    labels: [],
    links: [],
    ...overrides
  };
}


describe('search - Search', function() {

  describe('is:referenced', function() {

    let search;

    beforeEach(function() {
      search = createSearch();
    });


    it('should match issue linked from another issue', function() {

      // given
      const filter = search.getSearchFilter('is:referenced');

      const issue = createIssue({
        links: [
          { type: LinkTypes.LINKED_BY, target: createIssue({ number: 2 }) }
        ]
      });

      // when + then
      expect(filter(issue)).to.be.true;
    });


    it('should match issue closed by PR', function() {

      // given
      const filter = search.getSearchFilter('is:referenced');

      const issue = createIssue({
        links: [
          { type: LinkTypes.CLOSED_BY, target: createIssue({ number: 2 }) }
        ]
      });

      // when + then
      expect(filter(issue)).to.be.true;
    });


    it('should match PR closing another issue', function() {

      // given
      const filter = search.getSearchFilter('is:referenced');

      const issue = createIssue({
        links: [
          { type: LinkTypes.CLOSES, target: createIssue({ number: 2 }) }
        ]
      });

      // when + then
      expect(filter(issue)).to.be.true;
    });


    it('should match issue required by another item', function() {

      // given
      const filter = search.getSearchFilter('is:referenced');

      const issue = createIssue({
        links: [
          { type: LinkTypes.REQUIRED_BY, target: createIssue({ number: 2 }) }
        ]
      });

      // when + then
      expect(filter(issue)).to.be.true;
    });


    it('should match issue depending on another issue', function() {

      // given
      const filter = search.getSearchFilter('is:referenced');

      const issue = createIssue({
        links: [
          { type: LinkTypes.DEPENDS_ON, target: createIssue({ number: 2 }) }
        ]
      });

      // when + then
      expect(filter(issue)).to.be.true;
    });


    it('should match child of epic', function() {

      // given
      const filter = search.getSearchFilter('is:referenced');

      const issue = createIssue({
        links: [
          { type: LinkTypes.CHILD_OF, target: createIssue({ number: 2 }) }
        ]
      });

      // when + then
      expect(filter(issue)).to.be.true;
    });


    it('should match epic', function() {

      // given
      const filter = search.getSearchFilter('is:referenced');

      const issue = createIssue({
        links: [
          { type: LinkTypes.PARENT_OF, target: createIssue({ number: 2 }) }
        ]
      });

      // when + then
      expect(filter(issue)).to.be.true;
    });


    it('should NOT match issue with no links', function() {

      // given
      const filter = search.getSearchFilter('is:referenced');

      const issue = createIssue({ links: [] });

      // when + then
      expect(filter(issue)).to.be.false;
    });


    it('should support negation', function() {

      // given
      const filter = search.getSearchFilter('-is:referenced');

      const linked = createIssue({
        links: [
          { type: LinkTypes.LINKED_BY, target: createIssue({ number: 2 }) }
        ]
      });

      const unlinked = createIssue({ links: [] });

      // when + then
      expect(filter(linked)).to.be.false;
      expect(filter(unlinked)).to.be.true;
    });

  });

});
