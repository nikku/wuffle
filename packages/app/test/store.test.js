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

    it('should add', async function() {

      // given
      const store = createStore();

      // when
      const newIssue = createIssue();

      const createdIssue = await store.updateIssue(newIssue);

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


    it('should add new issue to front', async function() {

      // given
      const store = createStore();

      // when
      const firstIssue = await store.updateIssue(createIssue());
      const secondIssue = await store.updateIssue(createIssue());

      // then
      const issues = store.getIssues();

      expect(issues).to.eql([ secondIssue, firstIssue ]);
    });


    it('should update', async function() {

      // given
      const store = createStore();

      const newIssue = await store.updateIssue(createIssue());

      // when
      const updatedIssue = await store.updateIssue({
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

    it('should get by id', async function() {

      // given
      const store = createStore();

      const createdIssue = await store.updateIssue(createIssue());

      // when
      const issue = store.getIssueById(createdIssue.id);

      // then
      expect(issue).to.equal(createdIssue);
    });


    it('should get by key', async function() {

      // given
      const store = createStore();

      const createdIssue = await store.updateIssue(createIssue());

      // when
      const issue = store.getIssueByKey(createdIssue.key);

      // then
      expect(issue).to.equal(createdIssue);
    });

  });


  describe('issue removal', function() {

    it('should remove', async function() {

      // given
      const store = createStore();

      const { id, key } = await store.updateIssue(createIssue());

      // when
      await store.removeIssueById(id);

      // then
      expect(store.getIssueById(id)).not.to.exist;
      expect(store.getIssueByKey(key)).not.to.exist;

      const issues = store.getIssues();

      expect(issues).to.be.empty;
    });

  });


  describe('updates', function() {

    it('should always return cursor', function() {

      // given
      const store = createStore();

      // when
      const cursor = store.getUpdateCursor();

      // then
      expect(cursor).to.exist;

      expect(store.getUpdates(cursor)).to.be.empty;
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


    it('should establish links', async function() {

      // given
      const store = createStore();

      const issue_1 = await store.updateIssue(createIssue({
        repository
      }));

      const issue_2 = await store.updateIssue(createIssue({
        repository: otherRepository
      }));

      // when
      const issue = await store.updateIssue(createIssue({
        title: `Closes #${issue_1.number}`,
        repository,
        body: `
          Depends on ${issue_2.repository.owner.login}/${issue_2.repository.name}#${issue_2.number}
        `
      }));

      // then
      const updates = store.updates.getSince();

      expect(updates).to.have.length(3);

      const links = store.getIssueLinks(issue);

      expect(links).to.have.length(2);

      const links_1 = store.getIssueLinks(issue_1);

      expect(links_1).to.have.length(1);
    });


    it('should update links', async function() {

      // given
      const store = createStore();

      const linkedIssue = await store.updateIssue(createIssue({
        repository
      }));

      const issue = await store.updateIssue(createIssue({
        title: `Closes #${linkedIssue.number}`,
        repository
      }));

      // when
      await store.updateIssue({
        ...issue,
        title: 'FOO',
        body: 'BAR'
      });

      // then
      const links = store.getIssueLinks(issue);
      const linkedLinks = store.getIssueLinks(linkedIssue);

      expect(links).to.be.empty;
      expect(linkedLinks).to.be.empty;
    });


    it('should update inverse links', async function() {

      // given
      const store = createStore();

      const linkedIssue = await store.updateIssue(createIssue({
        repository
      }));

      const issue = await store.updateIssue(createIssue({
        title: `Closes #${linkedIssue.number}`,
        repository
      }));

      // when
      await store.updateIssue({
        ...issue,
        body: 'CHANGED'
      });

      const linkedLinks = store.getIssueLinks(linkedIssue);

      // then
      expect(linkedLinks).to.have.length(1);

      expect(linkedLinks[0].target.body).to.eql('CHANGED');
    });


    it('should remove links', async function() {

      // given
      const store = createStore();

      const linkedIssue = await store.updateIssue(createIssue({
        repository
      }));

      const issue = await store.updateIssue(createIssue({
        title: `Closes #${linkedIssue.number}`,
        repository
      }));

      // when
      await store.removeIssueById(issue.id);

      // then
      const issueLinks = store.getIssueLinks(issue);

      expect(issueLinks).to.be.empty;

      const linkedLinks = store.getIssueLinks(linkedIssue);

      expect(linkedLinks).to.be.empty;
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