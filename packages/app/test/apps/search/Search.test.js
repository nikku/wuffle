import { expect } from 'chai';

import Search from 'wuffle/lib/apps/search/Search.js';

import { LinkTypes } from 'wuffle/lib/links.js';

function createSearch(config = {}) {

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
  return new Search(config, logger, store);
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




  describe('is:approved', function() {

    const botReview = { user: { login: 'copilot[bot]', type: 'Bot' }, author_association: 'COLLABORATOR', state: 'approved' };
    const collaboratorReview = { user: { login: 'nikku', type: 'User' }, author_association: 'COLLABORATOR', state: 'approved' };
    const nonCollaboratorReview = { user: { login: 'outsider', type: 'User' }, author_association: 'NONE', state: 'approved' };


    it('should NOT count bot approvals', function() {

      // given
      const search = createSearch();
      const filter = search.getSearchFilter('is:approved');

      const pr = createIssue({ pull_request: true, reviews: [ botReview ] });

      // when + then
      expect(filter(pr)).to.be.false;
    });


    it('should NOT count non-collaborator approvals', function() {

      // given
      const search = createSearch();
      const filter = search.getSearchFilter('is:approved');

      const pr = createIssue({ pull_request: true, reviews: [ nonCollaboratorReview ] });

      // when + then
      expect(filter(pr)).to.be.false;
    });


    it('should count collaborator approvals', function() {

      // given
      const search = createSearch();
      const filter = search.getSearchFilter('is:approved');

      const pr = createIssue({ pull_request: true, reviews: [ collaboratorReview ] });

      // when + then
      expect(filter(pr)).to.be.true;
    });


    describe('with treatBotsAsReviewers=true', function() {

      it('should count bot approvals', function() {

        // given
        const search = createSearch({ treatBotsAsReviewers: true });
        const filter = search.getSearchFilter('is:approved');

        const pr = createIssue({ pull_request: true, reviews: [ botReview ] });

        // when + then
        expect(filter(pr)).to.be.true;
      });

    });

  });


  describe('is:reviewed', function() {

    const botReview = { user: { login: 'copilot[bot]', type: 'Bot' }, author_association: 'COLLABORATOR', state: 'changes_requested' };
    const collaboratorReview = { user: { login: 'nikku', type: 'User' }, author_association: 'COLLABORATOR', state: 'changes_requested' };
    const nonCollaboratorReview = { user: { login: 'outsider', type: 'User' }, author_association: 'NONE', state: 'changes_requested' };


    it('should NOT count bot reviews', function() {

      // given
      const search = createSearch();
      const filter = search.getSearchFilter('is:reviewed');

      const pr = createIssue({ pull_request: true, reviews: [ botReview ] });

      // when + then
      expect(filter(pr)).to.be.false;
    });


    it('should NOT count non-collaborator reviews', function() {

      // given
      const search = createSearch();
      const filter = search.getSearchFilter('is:reviewed');

      const pr = createIssue({ pull_request: true, reviews: [ nonCollaboratorReview ] });

      // when + then
      expect(filter(pr)).to.be.false;
    });


    it('should count collaborator reviews', function() {

      // given
      const search = createSearch();
      const filter = search.getSearchFilter('is:reviewed');

      const pr = createIssue({ pull_request: true, reviews: [ collaboratorReview ] });

      // when + then
      expect(filter(pr)).to.be.true;
    });


    describe('with treatBotsAsReviewers=true', function() {

      it('should count bot reviews', function() {

        // given
        const search = createSearch({ treatBotsAsReviewers: true });
        const filter = search.getSearchFilter('is:reviewed');

        const pr = createIssue({ pull_request: true, reviews: [ botReview ] });

        // when + then
        expect(filter(pr)).to.be.true;
      });

    });

  });

});
