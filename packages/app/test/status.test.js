const { expect } = require('chai');

const {
  Status,
} = require('../lib/status');


describe('status', function() {

  it('should add status', function() {

    // given
    const status = new Status();

    const filtered_status_event = {
      'sha': 'a2ef08f9ece317ce6e7db880d5b9ab4117449dbb',
      'key': 'JENKINS/TEST',
      'contexts': {
        'JENKINS/TEST': {
          'target_url': 'https://jenkin/test',
          'state': 'success'
        }
      }
    };

    // when
    const {
      sha,
      contexts
    } = status.addStatusEvent(filtered_status_event);

    // then
    expect(sha).to.eql('a2ef08f9ece317ce6e7db880d5b9ab4117449dbb');

    expect(contexts).to.eql({
      'JENKINS/TEST': {
        'state': 'success',
        'target_url': 'https://jenkin/test'
      },
    });

  });


  it('should retrieve status with single status', function() {

    // given
    const status = new Status();
    const currentStatus = {
      'sha': 'test1',
      'key': 'JENKINS/TEST',
      'contexts': {
        'JENKINS/TEST': {
          'target_url': 'https://jenkin/test',
          'state': 'success'
        }
      }
    };

    status.addStatusEvent(currentStatus);

    // when
    const issueStatus = status.getStatusBySha('test1');

    // then
    expect(issueStatus).to.eql([{
      'key': 'JENKINS/TEST',
      'target_url': 'https://jenkin/test',
      'state': 'success'
    }]);

  });

  it('should retrieve status with multiple status', function() {

    // given
    const status = new Status();

    status.addStatusEvent({
      'sha': 'test2',
      'key': 'JENKINS/TEST',
      'contexts': {
        'JENKINS/TEST': {
          'target_url': 'https://jenkin/test',
          'state': 'success'
        }
      }
    });
    status.addStatusEvent({
      'sha': 'test2',
      'key': 'OTHER/TEST',
      'contexts': {
        'OTHER/TEST': {
          'target_url': 'https://other/test',
          'state': 'success'
        }
      }
    });

    // when
    const issueStatus = status.getStatusBySha('test2');

    // then
    expect(issueStatus).to.eql([
      {
        'key': 'JENKINS/TEST',
        'target_url': 'https://jenkin/test',
        'state': 'success'
      },
      {
        'key': 'OTHER/TEST',
        'target_url': 'https://other/test',
        'state': 'success'
      }
    ]);

  });

  it('should remove status', function() {

    // given
    const status = new Status();

    status.addStatusEvent({
      'sha': 'test2',
      'key': 'JENKINS/TEST',
      'contexts': {
        'JENKINS/TEST': {
          'target_url': 'https://jenkin/test',
          'state': 'success'
        }
      }
    });

    // when
    const removed = status.removeStatusBySha('test2');

    const issueStatus = status.getStatusBySha('test2');

    // then
    expect(removed).to.eql({});
    expect(issueStatus).to.eql([]);


  });


  it('should export to JSON and restore', function() {

    // given
    const status = new Status();

    status.addStatusEvent({
      'sha': 'test2',
      'key': 'JENKINS/TEST',
      'contexts': {
        'JENKINS/TEST': {
          'target_url': 'https://jenkin/test',
          'state': 'success'
        }
      }
    });
    status.addStatusEvent({
      'sha': 'test2',
      'key': 'OTHER/TEST',
      'contexts': {
        'OTHER/TEST': {
          'target_url': 'https://other/test',
          'state': 'success'
        }
      }
    });

    // when
    const data = status.asJSON();

    const clonedStatus = new Status();
    clonedStatus.loadJSON(data);

    // when
    const issueStatus = clonedStatus.getStatusBySha('test2');

    // then
    expect(issueStatus).to.eql([
      {
        'key': 'JENKINS/TEST',
        'target_url': 'https://jenkin/test',
        'state': 'success'
      },
      {
        'key': 'OTHER/TEST',
        'target_url': 'https://other/test',
        'state': 'success'
      }
    ]);
  });

});