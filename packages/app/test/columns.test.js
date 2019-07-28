const { expect } = require('chai');

const Columns = require('../lib/columns');


describe('columns', function() {

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


    // helpers ////////////////////

    function expectIssueColumn(issue, expectedColumn) {

      const column = columns.getIssueColumn(issue);

      expect(column).to.eql(expectedColumn);
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


      it('<Done> to CLOSED', function() {
        expectStateColumn('CLOSED', 'Done');
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