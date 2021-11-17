const {
  filterIssueOrPull
} = require('../../../lib/apps/board-api-routes/board-api-filters');

const { expect } = require('chai');

const fs = require('fs');


describe('board-api-routes - board-api-filters', function() {

  it('should filter', function() {

    // given
    const issues = loadFixture('issues');
    const expectedIssues = loadFixture('issues_filtered');

    // when
    const filteredIssues = issues.map(filterIssueOrPull);

    // then
    expect(filteredIssues).to.eql(expectedIssues);
  });

});


// helpers /////////////

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(__dirname + '/' + name + '.json', 'utf-8'));
}

// eslint-disable-next-line
function saveFixture(name, contents) {
  return fs.writeFileSync(__dirname + '/' + name + '.json', JSON.stringify(contents, null, 2), 'utf-8');
}
