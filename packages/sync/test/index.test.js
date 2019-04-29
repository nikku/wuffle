const {
  expect
} = require('chai');

const {
  loadRecording
} = require('./recording');


describe.skip('bot', function() {

  it('should maintain store', async function() {

    // given
    const recording = loadRecording('repository-events');

    // when
    await recording.replay();

    // then
    const { app } = recording;

    const { store } = app;

    expect(store.getIssues()).to.have.length(2);

    expect(store.getIssue({ type: 'issue', number: 40, title: 'TEST 1', state: 'closed' })).to.exist;
    expect(store.getIssue({ type: 'pull-request', number: 41, state: 'closed' })).to.exist;
  });


  it('should handle issue life-cycle events', async function() {

    // given
    const recording = loadRecording('issue-events');

    // when
    await recording.replay();

    // then
    const { app } = recording;

    const { store } = app;

    const issue = store.getIssue({ number: 44 });

    expect(issue).to.exist;
    expect(issue.type).to.eql('issue');
  });


  it('should handle PR life-cycle events', async function() {

    // given
    const recording = loadRecording('pull-request-events');

    // when
    await recording.replay();

    // then
    const { app } = recording;


    const { store } = app;

    const issue = store.getIssue({ number: 48 });

    expect(issue).to.exist;
    expect(issue.type).to.eql('pull-request');
  });


  describe('labels', function() {

    it('should add label on <label.created>', async function() {

      // given
      const recording = loadRecording('create-label');

      // when
      await recording.replay();

      // then
      const { app } = recording;

      const { store } = app;

      expect(store.getLabels()).to.have.length(1);
    });

  });


  describe('milestones', function() {

    it('should add milestone on <milestone.created>', async function() {

      // given
      const recording = loadRecording('create-milestone');

      // when
      await recording.replay();

      // then
      const { app } = recording;

      const { store } = app;

      expect(store.getMilestones()).to.have.length(1);
    });

  });

});