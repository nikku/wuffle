const {
  expect
} = require('chai');

const Columns = require('../lib/columns');
const Events = require('../lib/events');
const Store = require('../lib/store');

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


    it('should update', async function() {

      // given
      const store = createStore();

      const newIssue = await store.updateIssue(createIssue());

      // when
      const updatedIssue = await store.updateIssue({
        id: newIssue.id,
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


    it('should update cumulative', async function() {

      // given
      const store = createStore();

      const { id } = await store.updateIssue(createIssue());


      // when
      await Promise.all([
        store.updateIssue({
          id,
          title: 'BAR'
        }),
        store.updateIssue({
          id,
          body: 'BLUB'
        })
      ]);

      // then
      const { title, body } = await store.getIssueById(id);

      expect(title).to.eql('BAR');
      expect(body).to.eql('BLUB');
    });


    it('should update, bumping updated_at', async function() {

      // given
      const store = createStore();

      const newIssue = await store.updateIssue(createIssue());

      // when
      const updatedIssue = await store.updateIssue({
        id: newIssue.id,
        title: 'BAR'
      });

      // then
      expect(new Date(updatedIssue.updated_at)).to.be.above(new Date(newIssue.updated_at));
    });


    it('should queue change, keeping updated_at untouched', async function() {

      // given
      const store = createStore();

      const newIssue = await store.updateIssue(createIssue({
        updated_at: new Date().toISOString()
      }));

      // when
      const updatedIssue = await store.queueUpdate({
        id: newIssue.id,
        title: 'BAR'
      });

      // then
      expect(updatedIssue.updated_at).to.eql(newIssue.updated_at);
    });

  });


  describe('issue bulk update', function() {

    let store;

    let issue_1, issue_2, issue_no_milestone;

    beforeEach(async function() {
      store = createStore();

      issue_1 = await store.updateIssue(createIssue({
        milestone: {
          id: 1,
          name: 'foo'
        }
      }));

      issue_2 = await store.updateIssue(createIssue({
        milestone: {
          id: 1,
          name: 'foo'
        }
      }));

      issue_no_milestone = await store.updateIssue(createIssue());
    });


    it('should update by selector', async function() {

      // when
      const updatedIssues = await store.updateIssues(issue => {
        if (issue.milestone && issue.milestone.id === 1) {
          return {
            milestone: null
          };
        }
      });

      // then
      expect(updatedIssues).to.have.length(2);

      expect(store.updates.getSince()).to.have.length(3);

      for (const issue of updatedIssues) {
        expect(issue.id).not.to.eql(issue_no_milestone.id);

        expect(issue.milestone).not.to.exist;
      }
    });


    it('should update explicit', async function() {

      // when
      const updatedIssues = await Promise.all([
        store.updateIssue({
          id: issue_1.id,
          milestone: {
            id: 1,
            name: 'foo'
          }
        }),
        store.updateIssue({
          id: issue_no_milestone.id,
          milestone: {
            id: 1,
            name: 'foo'
          }
        })
      ]);

      // then
      expect(updatedIssues).to.have.length(2);

      expect(store.updates.getSince()).to.have.length(3);

      for (const issue of updatedIssues) {
        expect(issue.id).not.to.eql(issue_2.id);

        expect(issue.milestone).to.exist;
      }
    });

  });


  describe('issue bulk insert', function() {

    it('should order last to first', async function() {

      // given
      const store = createStore();

      // when
      const issues = await Promise.all([
        store.updateIssue(createIssue()),
        store.updateIssue(createIssue()),
        store.updateIssue(createIssue())
      ]);

      // then
      expectOrder(store, [ issues[2], issues[1], issues[0] ]);
    });


    it('should insert before existing', async function() {

      // given
      const store = createStore();

      const issue = await store.updateIssue(createIssue());

      // when
      const issues = await Promise.all([
        store.updateIssue(createIssue()),
        store.updateIssue(createIssue()),
        store.updateIssue(createIssue())
      ]);

      // then
      expectOrder(store, [ issues[2], issues[1], issues[0], issue ]);
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


    it('should establish', async function() {

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

      const issue_links = store.getIssueLinks(issue);

      expect(issue_links).to.have.length(2);

      const issue_1_links = store.getIssueLinks(issue_1);

      expect(issue_1_links).to.have.length(1);
    });


    it('should update', async function() {

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


    it('should update multiple', async function() {

      // given
      const store = createStore();

      const issue_1 = await store.updateIssue(createIssue({
        title: 'Closes #5'
      }));

      const issue_2 = await store.updateIssue(createIssue({
        number: 5
      }));

      // when
      await Promise.all([
        store.updateIssue(issue_1),
        store.updateIssue(issue_2)
      ]);

      // then
      const links = store.getIssueLinks(issue_1);
      const linkedLinks = store.getIssueLinks(issue_2);

      expect(links).to.have.length(1);
      expect(linkedLinks).to.have.length(1);
    });


    it('should update inverse', async function() {

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


    it('should mark link source as changed', async function() {

      // given
      const store = createStore();

      const linkedIssue = await store.updateIssue(createIssue({
        title: 'LINKED',
        repository
      }));

      const issue = await store.updateIssue(createIssue({
        title: `Closes #${linkedIssue.number}`,
        repository
      }));

      // when
      await store.updateIssue({
        ...linkedIssue,
        body: 'CHANGED'
      });

      const issueLinks = store.getIssueLinks(issue);

      // then
      expect(issueLinks).to.have.length(1);

      expect(issueLinks[0].target.body).to.eql('CHANGED');
    });


    it('should remove', async function() {

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


  describe('ordering', function() {

    describe('default', function() {

      it('should add new issue to front', async function() {

        // given
        const store = createStore();

        // when
        const issue_A = await store.updateIssue(createIssue());
        const issue_B = await store.updateIssue(createIssue());

        // then
        expectOrder(store, [ issue_B, issue_A ]);
      });


      it('should not sort', async function() {

        // given
        const store = createStore();

        // when
        const issue_A = await store.updateIssue(createIssue({
          state: 'closed'
        }));

        const issue_B = await store.updateIssue(createIssue({
          state: 'closed',
          title: `issue_B - Depends on #${issue_A.number}`
        }));

        // then
        expectOrder(store, [ issue_B, issue_A ]);
      });

    });


    describe('sorting', function() {

      it('should put before CLOSES', async function() {

        // given
        const store = createStore();

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        // when
        const issue_B = await store.updateIssue(createIssue({
          title: 'issue_B - Closes #1'
        }));

        // then
        expectOrder(store, [ issue_B, issue_A ]);
      });


      it('should put after DEPENDS_ON', async function() {

        // given
        const store = createStore();

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        // when
        const issue_B = await store.updateIssue(createIssue({
          title: 'issue_B - Depends on #1'
        }));

        // then
        expectOrder(store, [ issue_A, issue_B ]);
      });


      it('should put between', async function() {

        // given
        const store = createStore();

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        const issue_B = await store.updateIssue(createIssue({
          number: 2,
          title: 'issue_B'
        }));

        // when
        const issue_C = await store.updateIssue(createIssue({
          title: 'issue_C - Depends on #2 Closes #1'
        }));

        // then
        expectOrder(store, [ issue_B, issue_C, issue_A ]);
      });


      it('should put after two', async function() {

        // given
        const store = createStore();

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        const issue_B = await store.updateIssue(createIssue({
          number: 2,
          title: 'issue_B'
        }));

        // when
        const issue_C = await store.updateIssue(createIssue({
          title: 'issue_C - Depends on #2 Depends on #1'
        }));

        // then
        expectOrder(store, [ issue_B, issue_A, issue_C ]);
      });


      it('should put before two', async function() {

        // given
        const store = createStore();

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        const issue_B = await store.updateIssue(createIssue({
          number: 2,
          title: 'issue_B - Depends on #1'
        }));

        const issue_C = await store.updateIssue(createIssue({
          number: 3,
          title: 'issue_C - Depends on #2'
        }));

        // when
        const issue_D = await store.updateIssue(createIssue({
          title: 'issue_D - Closes #2 Closes #3'
        }));

        // then
        expectOrder(store, [ issue_D, issue_A, issue_B, issue_C ]);
      });


      it('should handle ordering conflict', async function() {

        // given
        const store = createStore();

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        const issue_B = await store.updateIssue(createIssue({
          number: 2,
          title: 'issue_B'
        }));

        // when
        const issue_C = await store.updateIssue(createIssue({
          title: 'issue_C - Depends on #1 Closes #2'
        }));

        // then
        expectOrder(store, [ issue_B, issue_C, issue_A ]);
      });


      it('should keep unlinked order without column change', async function() {

        // given
        const store = createStore();

        // when
        const issue_A = await store.updateIssue(createIssue({
          state: 'closed'
        }));

        const issue_B = await store.updateIssue(createIssue({
          state: 'closed'
        }));

        const issue_C = await store.updateIssue(createIssue({
          state: 'closed'
        }));

        const issue_D = await store.updateIssue(createIssue({
          state: 'open'
        }));

        // when
        const updated_issue_D = await store.updateIssueOrder(issue_D, issue_A.id, issue_B.id, 'Done');

        const final_issue_D = await store.updateIssue({
          id: issue_D.id,
          state: 'closed'
        });

        // then
        expect(final_issue_D.order).to.eql(updated_issue_D.order);

        expectOrder(store, [ issue_C, issue_B, issue_D, issue_A ]);
      });

    });


    describe('fifo', function() {

      const columnConfig = [
        { name: 'Inbox', label: null, sorting: true, fifo: true },
        { name: 'Backlog', label: 'backlog', sorting: true },
        { name: 'Ready', label: 'ready', sorting: true },
        { name: 'In Progress', label: 'in progress', sorting: true },
        { name: 'Needs Review', label: 'needs review', sorting: true },
        { name: 'Done', label: null, closed: true }
      ];


      it('should add new issue to the end', async function() {

        // given
        const store = createStore(columnConfig);

        // when
        const issue_A = await store.updateIssue(createIssue());
        const issue_B = await store.updateIssue(createIssue());

        // then
        expectOrder(store, [ issue_A, issue_B ]);
      });


      it('should put before CLOSES', async function() {

        // given
        const store = createStore(columnConfig);

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        // when
        const issue_B = await store.updateIssue(createIssue({
          title: 'issue_B - Closes #1'
        }));

        // then
        expectOrder(store, [ issue_B, issue_A ]);
      });


      it('should put after DEPENDS_ON', async function() {

        // given
        const store = createStore(columnConfig);

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        // when
        const issue_B = await store.updateIssue(createIssue({
          title: 'issue_B - Depends on #1'
        }));

        // then
        expectOrder(store, [ issue_A, issue_B ]);
      });


      it('should put between', async function() {

        // given
        const store = createStore(columnConfig);

        const issue_B = await store.updateIssue(createIssue({
          number: 2,
          title: 'issue_B'
        }));

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        // when
        const issue_C = await store.updateIssue(createIssue({
          title: 'issue_C - Depends on #2 Closes #1'
        }));

        // then
        expectOrder(store, [ issue_B, issue_C, issue_A ]);
      });


      it('should put after two', async function() {

        // given
        const store = createStore(columnConfig);

        const issue_B = await store.updateIssue(createIssue({
          number: 2,
          title: 'issue_B'
        }));

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        // when
        const issue_C = await store.updateIssue(createIssue({
          title: 'issue_C - Depends on #2 Depends on #1'
        }));

        // then
        expectOrder(store, [ issue_B, issue_A, issue_C ]);
      });


      it('should put before two', async function() {

        // given
        const store = createStore(columnConfig);

        const issue_A = await store.updateIssue(createIssue({
          number: 1,
          title: 'issue_A'
        }));

        const issue_B = await store.updateIssue(createIssue({
          number: 2,
          title: 'issue_B - Depends on #1'
        }));

        const issue_C = await store.updateIssue(createIssue({
          number: 3,
          title: 'issue_C - Depends on #2'
        }));

        // when
        const issue_D = await store.updateIssue(createIssue({
          title: 'issue_D - Closes #2 Closes #3'
        }));

        // then
        expectOrder(store, [ issue_D, issue_A, issue_B, issue_C ]);
      });

    });

  });

});


// helpers //////////////////

const defaultColumnConfig = [
  { name: 'Inbox', label: null, sorting: true },
  { name: 'Backlog', label: 'backlog', sorting: true },
  { name: 'Ready', label: 'ready', sorting: true },
  { name: 'In Progress', label: 'in progress', sorting: true },
  { name: 'Needs Review', label: 'needs review', sorting: true },
  { name: 'Done', label: null, closed: true }
];

function createStore(columnConfig = defaultColumnConfig) {

  const log = {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {}
  };

  const events = new Events();

  const logger = {
    child(name) {
      return log;
    }
  };

  const columns = new Columns(columnConfig || defaultColumnConfig);

  return new Store(columns, logger, events);
}


const createIssue = (function() {

  let numbers = [ -1 ];

  return function createIssue(config = {}) {

    const number = config.number || Math.max(...numbers) + 1;

    numbers.push(number);

    const defaultConfig = {
      id: `i-${number}`,
      number,
      title: `test title - ${number}`,
      body: 'empty body',
      labels: [],
      updated_at: '2019-10-19T18:54:17.533Z',
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


function expectOrder(store, issues) {

  for (const i in issues) {

    const last = issues[i - 1];
    const current = issues[i];

    if (last) {

      const lastOrder = store.getIssueOrder(last.id);
      const currentOrder = store.getIssueOrder(current.id);

      if (lastOrder >= currentOrder) {
        throw new Error(
          `expected order [ "${last.title}", "${current.title}" ], found inverse`
        );
      }
    }
  }
}