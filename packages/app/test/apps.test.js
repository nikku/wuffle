const { expect } = require('chai');

const nock = require('nock');

const SyncApp = require('..');

const { Probot } = require('probot');


function disableConnect() {
  nock.disableNetConnect();
}

function enableConnect() {
  nock.enableNetConnect();
}


describe('apps', () => {

  before(disableConnect);

  after(enableConnect);

  let app, probot;

  beforeEach(() => {
    probot = new Probot({});

    app = probot.load(SyncApp);
  });


  describe('automatic-dev-flow', function() {

    describe('state update', function() {

      it('should compute Inbox -> Done', function() {

        // given
        const issue = {
          labels: [
            {
              name: 'bug'
            }
          ],
          state: 'open'
        };

        // when
        const update = app.getStateUpdate(issue, 'Done');

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

        // when
        const update = app.getStateUpdate(issue, 'Inbox');

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

        // when
        const update = app.getStateUpdate(issue, 'Done');

        // then
        expect(update).to.eql({
          state: 'closed',
          labels: [ 'bug' ]
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

        // when
        const update = app.getStateUpdate(issue, 'Inbox');

        // then
        expect(update).to.eql({
          labels: [ 'bug' ]
        });

      });


      it('should compute Done -> Done (removing labels)', function() {

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

        // when
        const update = app.getStateUpdate(issue, 'Done');

        // then
        expect(update).to.eql({
          labels: [ 'bug' ]
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
        const update = app.getAssigneeUpdate(issue, 'mike');

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
        const update = app.getAssigneeUpdate(issue, null);

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
        const update = app.getAssigneeUpdate(issue, 'mike');

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
        const update = app.getAssigneeUpdate(issue, 'walt');

        // then
        expect(update).to.eql({ });

      });

    });


    it('should move issue', function() {

    });

  });


});