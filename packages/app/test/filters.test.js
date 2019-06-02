const { expect } = require('chai');

const {
  filterIssue,
  filterPull
} = require('../lib/filters');


const fs = require('fs');


describe('filters', function() {

  it('should filter issue', function() {

    // given
    const {
      issue,
      repository
    } = loadEvent('issues.milestoned').payload;

    const expectedIssue = loadFiltered('issue-with-milestone');

    // when
    const filtered = filterIssue(issue, repository);

    // then
    expect(filtered).to.eql(expectedIssue);
  });


  it('should filter pull request', function() {

    // given
    const {
      pull_request,
      repository
    } = loadEvent('pull_request.labeled').payload;

    const expectedIssue = loadFiltered('pull_request');

    // when
    const filtered = filterPull(pull_request, repository);

    // then
    expect(filtered).to.eql(expectedIssue);
  });

});


// eslint-disable-next-line
function writeFiltered(name, value) {
  fs.writeFileSync(__dirname + '/fixtures/filters/filtered/' + name + '.json', JSON.stringify(value), 'utf8');
}

function loadFiltered(name) {
  const json = fs.readFileSync(__dirname + '/fixtures/filters/filtered/' + name + '.json', 'utf8');

  return JSON.parse(json);
}

function loadEvent(name) {
  const json = fs.readFileSync(__dirname + '/fixtures/filters/events/' + name + '.json', 'utf8');

  return JSON.parse(json);
}