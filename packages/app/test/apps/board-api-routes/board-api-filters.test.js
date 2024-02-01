import { expect } from 'chai';

import fs from 'node:fs';

import { relativePath } from 'wuffle/lib/util/index.js';

import { filterIssueOrPull } from 'wuffle/lib/apps/board-api-routes/board-api-filters.js';


describe('board-api-routes - board-api-filters', function() {

  it('should filter', function() {

    // given
    const issues = loadFixture('issues');
    const expectedIssues = loadFixture('issues.filtered');

    // when
    const filteredIssues = issues.map(filterIssueOrPull);

    // then
    expect(filteredIssues).to.eql(expectedIssues);
  });

});


// helpers /////////////

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(relativePath(name + '.json', import.meta.url), 'utf-8'));
}

// eslint-disable-next-line
function saveFixture(name, contents) {
  return fs.writeFileSync(relativePath(name + '.json', import.meta.url), JSON.stringify(contents, null, 2), 'utf-8');
}
