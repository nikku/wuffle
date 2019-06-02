const {
  expect
} = require('chai');

const Store = require('../lib/store');
const Columns = require('../lib/columns');

const {
  getKey
} = require('../lib/filters');

const {
  merge
} = require('min-dash');


describe('store', function() {

  describe('issue add / update', function() {

    it('should add', function() {

      // given
      const store = createStore();

      // when
      const newIssue = createIssue();

      const createdIssue = store.updateIssue(newIssue);

      const {
        column,
        order,
        ...data
      } = createdIssue;

      // then
      const issues = store.getIssues();

      expect(issues).to.eql([ createdIssue ]);

      expect(column).to.eql('Inbox');
      expect(order).to.exist;
      expect(data).to.eql(newIssue);
    });


    it('should update', function() {

      // given
      const store = createStore();

      const newIssue = store.updateIssue(createIssue());

      // when
      const updatedIssue = store.updateIssue({
        ...newIssue,
        title: 'BAR',
        body: 'BLUB',
        labels: [
          {
            name: 'backlog',
            column_label: true
          },
          {
            name: 'other'
          }
        ]
      });

      const {
        column,
        order
      } = updatedIssue;

      // then
      const issues = store.getIssues();

      expect(issues).to.eql([ updatedIssue ]);

      expect(column).to.eql('Backlog');
      expect(order).to.exist;
    });

  });


  describe('issue retrival', function() {

    it('should get by id', function() {

      // given
      const store = createStore();

      const createdIssue = store.updateIssue(createIssue());

      // when
      const issue = store.getIssueById(createdIssue.id);

      // then
      expect(issue).to.equal(createdIssue);
    });


    it('should get by key', function() {

      // given
      const store = createStore();

      const createdIssue = store.updateIssue(createIssue());

      // when
      const issue = store.getIssueByKey(createdIssue.key);

      // then
      expect(issue).to.equal(createdIssue);
    });

  });


  describe('issue removal', function() {

    it('should remove', function() {

      // given
      const store = createStore();

      const { id, key } = store.updateIssue(createIssue());

      // when
      store.removeIssueById(id);

      // then
      expect(store.getIssueById(id)).not.to.exist;
      expect(store.getIssueByKey(key)).not.to.exist;

      const issues = store.getIssues();

      expect(issues).to.be.empty;
    });

  });


  describe('links', function() {

    const repository = {
      name: 'foo',
      owner: {
        login: 'bar'
      }
    };

    const otherRepository = {
      name: 'other',
      owner: {
        login: 'bar'
      }
    };


    it('should establish links', function() {

      // given
      const store = createStore();

      const issue_1 = store.updateIssue(createIssue({
        repository
      }));

      const issue_2 = store.updateIssue(createIssue({
        repository: otherRepository
      }));

      // when
      store.updateIssue(createIssue({
        title: `Closes #${issue_1.number}`,
        repository,
        body: `
          Depends on ${otherRepository.owner.login}/${otherRepository.name}#${issue_2.number}
        `
      }));

      const updates = store.updates.getSince();

      // then
      expect(updates).to.have.length(3);
    });

  });

});


// helpers //////////////////

function createStore(columnConfig) {

  const log = {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {}
  };

  const defaultColumnConfig = [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog' },
    { name: 'Ready', label: 'ready' },
    { name: 'In Progress', label: 'in progress' },
    { name: 'Needs Review', label: 'needs review' },
    { name: 'Done', label: null, closed: true }
  ];

  const columns = new Columns(columnConfig || defaultColumnConfig);

  return new Store(columns, log);
}


const createIssue = (function() {

  let counter = 0;

  return function createIssue(config) {

    const number = counter++;

    const defaultConfig = {
      id: `i-${number}`,
      number,
      title: 'test title',
      body: 'empty body',
      labels: [],
      milestone: null,
      pull_request: false,
      assignees: [],
      requested_reviewers: [],
      repository: {
        name: 'test-repo',
        owner: {
          login: 'test-owner'
        }
      }
    };

    const issue = merge({}, defaultConfig, config);

    return {
      ...issue,
      key: getKey(issue, issue.repository)
    };
  };
})();