const {
  expect
} = require('chai');

const Store = require('../lib/store');


describe.skip('Store', function() {

  let store;

  beforeEach(function() {
    store = new Store({
      columns: [
        { name: 'Inbox', label: null },
        { name: 'Backlog', label: 'backlog' },
        { name: 'Ready', label: 'ready' },
        { name: 'In Progress', label: 'in progress' },
        { name: 'Needs Review', label: 'needs review' },
        { name: 'Done', label: null, closed: true }
      ]
    });

  });


  it('should add issue', function() {

    // when
    const issue = {
      id: 'foo',
      title: 'Foo',
      type: 'issue',
      labels: []
    };

    store.addIssue(issue);

    // then
    const issues = store.getIssues();

    expect(issues).to.have.length(1);
    expect(issues[0]).to.eql({
      ...issue,
      column: 'Inbox'
    });
  });


  it('should remove issue', function() {

    // given
    const issue = {
      id: 'foo',
      title: 'Foo',
      type: 'issue',
      labels: []
    };

    store.addIssue(issue);

    // when
    store.removeIssue(issue);

    // then
    expect(store.getIssues()).to.have.length(0);
  });


  it('should replace issue', function() {

    // given
    const issue = {
      id: 'foo',
      title: 'Foo',
      type: 'issue',
      labels: []
    };

    const updatedIssue = {
      id: 'foo',
      title: 'Bar',
      type: 'issue',
      labels: [
        { name: 'in progress' }
      ]
    };

    store.addIssue(issue);

    // when
    store.replaceIssue(updatedIssue);

    // then
    const issues = store.getIssues({ id: 'foo' });

    expect(store.getIssues()).to.have.length(1);
    expect(issues[0].title).to.eql('Bar');
    expect(issues[0].column).to.eql('In Progress');
  });


  it('should get issues (filter)', function() {

    // given
    const issue1 = {
      id: 'foo',
      title: 'Foo',
      type: 'issue',
      labels: []
    };

    const issue2 = {
      id: 'bar',
      title: 'Bar',
      type: 'pull-request',
      labels: []
    };

    store.addIssue(issue1);
    store.addIssue(issue2);

    // assume
    expect(store.getIssues()).to.have.length(2);

    // when
    const issues = store.getIssues({ id: 'foo' });

    // then
    expect(issues).to.have.length(1);
    expect(issues[0]).to.eql({
      ...issue1,
      column: 'Inbox'
    });
  });


  it('should get single issue (filter)', function() {

    // given
    const issue1 = {
      id: 'foo',
      title: 'Foo',
      type: 'pull-request',
      labels: []
    };

    const issue2 = {
      id: 'bar',
      title: 'Bar',
      type: 'issue',
      labels: []
    };

    store.addIssue(issue1);
    store.addIssue(issue2);

    // assume
    expect(store.getIssues()).to.have.length(2);

    // when
    const issue = store.getIssue({ id: 'foo' });

    // then
    expect(issue).to.exist;
    expect(issue.id).to.eql('foo');
  });

});