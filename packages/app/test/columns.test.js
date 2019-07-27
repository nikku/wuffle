const { expect } = require('chai');

const Columns = require('../lib/columns');


describe('columns', function() {

  const config = [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog' },
    { name: 'Ready', label: 'ready' },
    { name: 'In Progress', label: 'in progress' },
    { name: 'Needs Review', label: 'needs review' },
    { name: 'Done', label: null, closed: true },
    { name: 'Some Column', label: 'special label', closed: true }
  ];

  const columns = new Columns(config);


  describe('issue mapping', function() {

    it('should map Inbox', function() {

      expectColumn({
        labels: [
          { name: 'bug' }
        ],
        state: 'open'
      }, 'Inbox');

      expectColumn({
        labels: [],
        state: 'open'
      }, 'Inbox');

    });


    it('should map Needs Review', function() {

      expectColumn({
        labels: [
          { name: 'bug' },
          { name: 'needs review' }
        ],
        state: 'open'
      }, 'Needs Review');

    });


    it('should map Backlog', function() {

      expectColumn({
        labels: [
          { name: 'enhancement' },
          { name: 'backlog' }
        ],
        state: 'open'
      }, 'Backlog');

    });


    it('should map Done', function() {

      expectColumn({
        labels: [
          { name: 'enhancement' },
          { name: 'backlog' }
        ],
        state: 'closed'
      }, 'Done');

      expectColumn({
        labels: [],
        state: 'closed'
      }, 'Done');

    });


    it('should map Some Column', function() {

      expectColumn({
        labels: [
          { name: 'special label' }
        ],
        state: 'closed'
      }, 'Some Column');

    });

  });


  // helpers ///////////////////

  function expectColumn(issue, expectColumn) {

    const column = columns.getIssueColumn(issue);

    expect(column).to.eql(expectColumn);
  }
});