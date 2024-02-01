import { expect } from 'chai';

import Columns from 'wuffle/lib/columns.js';


describe('columns', function() {

  describe('validation', function() {

    describe('should reject invalid config', function() {

      function expectError(columns, message) {
        expect(() => {
          new Columns(columns);
        }).to.throw(message);
      }

      it('missing DEFAULT column', function() {
        expectError([
          { name: 'In Progress', label: 'in progress' },
          { name: 'Needs Review', label: 'needs review' },
          { name: 'Done', label: null, closed: true }
        ], 'no column mapped to state DEFAULT or called Inbox');
      });

      it('missing IN_PROGRESS column', function() {
        expectError([
          { name: 'Inbox', label: null },
          { name: 'Needs Review', label: 'needs review' },
          { name: 'Done', label: null, closed: true }
        ], 'no column mapped to state IN_PROGRESS or called In Progress');
      });


      it('missing IN_REVIEW column', function() {
        expectError([
          { name: 'Inbox', label: null },
          { name: 'In Progress', label: 'in progress' },
          { name: 'Done', label: null, closed: true }
        ], 'no column mapped to state IN_REVIEW or called Needs Review');
      });


      it('missing DONE column', function() {
        expectError([
          { name: 'Inbox', label: null },
          { name: 'In Progress', label: 'in progress' },
          { name: 'Needs Review', label: 'needs review' }
        ], 'no column mapped to state DONE or called Done');
      });

    });

  });


  describe('should map issue', function() {

    const columns = new Columns([
      { name: 'Inbox', label: null },
      { name: 'Backlog', label: 'backlog' },
      { name: 'Ready', label: 'ready' },
      { name: 'In Progress', label: 'in progress' },
      { name: 'Needs Review', label: 'needs review' },
      { name: 'Done', label: null, closed: true },
      { name: 'Some Column', label: 'post-done', closed: true }
    ]);


    it('open, no column label', function() {

      expectIssueColumn({
        labels: [
          { name: 'bug' }
        ],
        state: 'open'
      }, 'Inbox');

      expectIssueColumn({
        labels: [],
        state: 'open'
      }, 'Inbox');

    });


    it('open, column label <needs review>', function() {

      expectIssueColumn({
        labels: [
          { name: 'bug' },
          { name: 'needs review' }
        ],
        state: 'open'
      }, 'Needs Review');

    });


    it('open, column label <backlog>', function() {

      expectIssueColumn({
        labels: [
          { name: 'enhancement' },
          { name: 'backlog' }
        ],
        state: 'open'
      }, 'Backlog');

    });


    it('closed', function() {

      expectIssueColumn({
        labels: [
          { name: 'enhancement' },
          { name: 'backlog' }
        ],
        state: 'closed'
      }, 'Done');

      expectIssueColumn({
        labels: [],
        state: 'closed'
      }, 'Done');

    });


    it('closed, colum label <post-done>', function() {

      expectIssueColumn({
        labels: [
          { name: 'post-done' }
        ],
        state: 'closed'
      }, 'Some Column');

    });


    describe('in a stable manner', function() {

      it('open, removed column label', function() {
        expectIssueColumn({
          labels: [],
          state: 'open',
          column: 'Needs Review'
        }, 'Inbox');
      });


      it('open, add column label', function() {

        expectIssueColumn({
          labels: [
            { name: 'needs review' }
          ],
          state: 'open',
          column: 'Inbox'
        }, 'Needs Review');

      });


      it('open, column changes', function() {

        expectIssueColumn({
          labels: [
            { name: 'backlog' },
            { name: 'needs review' }
          ],
          state: 'open',
          column: 'Backlog'
        }, 'Backlog');

        expectIssueColumn({
          labels: [
            { name: 'backlog' },
            { name: 'needs review' }
          ],
          state: 'open',
          column: 'Needs Review'
        }, 'Needs Review');
      });


      it('closed, existing column', function() {

        expectIssueColumn({
          labels: [
            { name: 'needs review' }
          ],
          state: 'closed',
          column: 'Needs Review'
        }, 'Done');

      });

    });


    // helpers ////////////////////

    function expectIssueColumn(issue, expectedColumn) {

      const column = columns.getIssueColumn(issue);

      expect(column.name).to.eql(expectedColumn);
    }

  });


  describe('state mapping', function() {

    describe('should map by name', function() {

      const columns = new Columns([
        { name: 'Inbox', label: null },
        { name: 'In Progress', label: 'in progress' },
        { name: 'Needs Review', label: 'needs review' },
        { name: 'Done', label: null, closed: true }
      ]);


      it('<Inbox> to DEFAULT + EXTERNAL_CONTRIBUTION', function() {
        expectStateColumn('DEFAULT', 'Inbox');
        expectStateColumn('EXTERNAL_CONTRIBUTION', 'Inbox');
      });


      it('<Needs Review> to IN_REVIEW', function() {
        expectStateColumn('IN_REVIEW', 'Needs Review');
      });


      it('<Done> to DONE', function() {
        expectStateColumn('DONE', 'Done');
      });


      // helpers ////////////////////

      function expectStateColumn(state, expectedColumn) {

        const column = columns.getByState(state);

        expect(column).to.exist;
        expect(column.name).to.eql(expectedColumn);
      }

    });


    describe('should map explicit', function() {

      const columns = new Columns([
        { name: 'Default', label: null, states: [ 'DEFAULT' ] },
        { name: 'External Contribution', label: null, states: [ 'EXTERNAL_CONTRIBUTION' ] },
        { name: 'Doing', label: 'in progress', states: [ 'IN_PROGRESS' ] },
        { name: 'Reviewing', label: 'needs review', states: [ 'IN_REVIEW' ] },
        { name: 'Closed', label: null, closed: true, states: [ 'DONE' ] }
      ]);


      it('<Default> to DEFAULT', function() {
        expectStateColumn('DEFAULT', 'Default');
      });


      it('<External Contribution> to EXTERNAL_CONTRIBUTION', function() {
        expectStateColumn('EXTERNAL_CONTRIBUTION', 'External Contribution');
      });


      it('<Reviewing> to IN_REVIEW', function() {
        expectStateColumn('IN_REVIEW', 'Reviewing');
      });


      it('<Closed> to DONE', function() {
        expectStateColumn('DONE', 'Closed');
      });


      // helpers ////////////////////

      function expectStateColumn(state, expectedColumn) {

        const column = columns.getByState(state);

        expect(column).to.exist;
        expect(column.name).to.eql(expectedColumn);
      }

    });

  });

});