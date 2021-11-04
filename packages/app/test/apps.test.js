const { expect } = require('chai');

const {
  bootstrap
} = require('./helpers');

const GithubIssues = require('../lib/apps/github-issues');

const nock = require('nock');


function disableConnect() {
  nock.disableNetConnect();
}

function enableConnect() {
  nock.enableNetConnect();
}


describe('apps', () => {

  before(disableConnect);

  after(enableConnect);


  describe('githubIssues', function() {

    let app, githubIssues, columns;

    beforeEach(async function() {
      app = await bootstrap({
        modules: [ GithubIssues ]
      });

      githubIssues = await app.get('githubIssues');

      columns = await app.get('columns');
    });


    describe('state update', function() {

      it('should compute Inbox -> Done', async function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            }
          ],
          state: 'open'
        };

        const newColumn = columns.getByState('DONE');

        // when
        const update = githubIssues.getStateUpdate(issue, newColumn);

        // then
        expect(update).to.eql({
          state: 'closed'
        });

      });


      it('should compute Inbox -> Inbox', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            }
          ],
          state: 'open'
        };

        const newColumn = columns.getByState('DEFAULT');

        // when
        const update = githubIssues.getStateUpdate(issue, newColumn);

        // then
        expect(update).to.eql({});

      });


      it('should compute Needs Review -> Done', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            },
            {
              name: 'needs review'
            }
          ],
          state: 'open'
        };

        const newColumn = columns.getByState('DONE');

        // when
        const stateUpdate = githubIssues.getStateUpdate(issue, newColumn);

        // then
        expect(stateUpdate).to.eql({
          state: 'closed'
        });

      });


      it('should compute Needs Review -> Inbox', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            },
            {
              name: 'needs review'
            }
          ],
          state: 'open'
        };

        const newColumn = columns.getByState('DEFAULT');

        // when
        const update = githubIssues.getStateUpdate(issue, newColumn);

        // then
        expect(update).to.eql({});
      });


      it('should compute Done -> Done', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            },
            {
              name: 'needs review'
            },
            {
              name: 'in progress'
            }
          ],
          state: 'closed'
        };

        const newColumn = columns.getByState('DONE');

        // when
        const update = githubIssues.getStateUpdate(issue, newColumn);

        // then
        expect(update).to.eql({});
      });


      it('should compute Done -> In Progress', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            }
          ],
          state: 'closed'
        };

        const newColumn = columns.getByState('IN_PROGRESS');

        // when
        const update = githubIssues.getStateUpdate(issue, newColumn);

        // then
        expect(update).to.eql({
          state: 'open'
        });

      });

    });


    describe('label update', function() {

      it('should compute Inbox -> Done', async function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            }
          ],
          state: 'open'
        };

        const newColumn = columns.getByState('DONE');

        // when
        const update = githubIssues.getLabelUpdate(issue, newColumn);

        // then
        expect(update).to.eql({
          addLabels: [],
          removeLabels: []
        });

      });


      it('should compute Inbox -> Inbox', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            }
          ],
          state: 'open'
        };

        const newColumn = columns.getByState('DEFAULT');

        // when
        const update = githubIssues.getLabelUpdate(issue, newColumn);

        // then
        expect(update).to.eql({
          addLabels: [],
          removeLabels: []
        });

      });


      it('should compute Needs Review -> Done', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            },
            {
              name: 'needs review'
            }
          ],
          state: 'open'
        };

        const newColumn = columns.getByState('DONE');

        // when
        const stateUpdate = githubIssues.getLabelUpdate(issue, newColumn);

        // then
        expect(stateUpdate).to.eql({
          addLabels: [],
          removeLabels: [ 'needs review' ]
        });

      });


      it('should compute Needs Review -> Inbox', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            },
            {
              name: 'needs review'
            }
          ],
          state: 'open'
        };

        const newColumn = columns.getByState('DEFAULT');

        // when
        const update = githubIssues.getLabelUpdate(issue, newColumn);

        // then
        expect(update).to.eql({
          addLabels: [],
          removeLabels: [ 'needs review' ]
        });

      });


      it('should compute Done -> Done', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            },
            {
              name: 'needs review'
            },
            {
              name: 'in progress'
            }
          ],
          state: 'closed'
        };

        const newColumn = columns.getByState('DONE');

        // when
        const update = githubIssues.getLabelUpdate(issue, newColumn);

        // then
        expect(update).to.eql({
          addLabels: [],
          removeLabels: [ 'in progress', 'needs review' ]
        });

      });


      it('should compute Done -> In Progress', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            }
          ],
          state: 'closed'
        };

        const newColumn = columns.getByState('IN_PROGRESS');

        // when
        const update = githubIssues.getLabelUpdate(issue, newColumn);

        // then
        expect(update).to.eql({
          addLabels: [ 'in progress' ],
          removeLabels: []
        });

      });

    });


    describe('assignee update', function() {

      it('should assign', function() {

        // given
        const issue = {
          assignees: []
        };

        // when
        const update = githubIssues.getAssigneeUpdate(issue, 'mike');

        // then
        expect(update).to.eql({
          assignees: [
            'mike'
          ]
        });

      });


      it('should handle noop', function() {

        // given
        const issue = {
          assignees: []
        };

        // when
        const update = githubIssues.getAssigneeUpdate(issue, null);

        // then
        expect(update).to.eql({});

      });


      it('should add assignee', function() {

        // given
        const issue = {
          assignees: [
            { login: 'walt' },
            { login: 'lisa' }
          ]
        };

        // when
        const update = githubIssues.getAssigneeUpdate(issue, 'mike');

        // then
        expect(update).to.eql({
          assignees: [
            'walt',
            'lisa',
            'mike'
          ]
        });

      });


      it('should keep assignees', function() {

        // given
        const issue = {
          assignees: [
            { login: 'walt' },
            { login: 'lisa' }
          ]
        };

        // when
        const update = githubIssues.getAssigneeUpdate(issue, 'walt');

        // then
        expect(update).to.eql({ });

      });

    });

  });


});