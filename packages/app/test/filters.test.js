import { expect } from 'chai';

import fs from 'node:fs';

import { filterIssue, filterPull } from 'wuffle/lib/filters.js';

import { relativePath } from 'wuffle/lib/util/index.js';


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


  it('should filter pull request, shimming merged property', function() {

    // given
    const pull_request = loadApiResult('pull_request');

    const repository = loadApiResult('repository');

    const expectedIssue = loadFiltered('pull_request.background-synched');

    // when
    const filtered = filterPull(pull_request, repository);

    // then
    expect(filtered).to.eql(expectedIssue);
  });

});

const filteredDir = relativePath('./fixtures/filters/filtered/', import.meta.url);

// eslint-disable-next-line
function writeFiltered(name, value) {
  fs.writeFileSync(relativePath(name + '.json', filteredDir), JSON.stringify(value, null, '  '), 'utf8');
}

function loadFiltered(name) {
  const json = fs.readFileSync(relativePath(name + '.json', filteredDir), 'utf8');

  return JSON.parse(json);
}

const eventsDir = relativePath('./fixtures/filters/events/', import.meta.url);

function loadEvent(name) {
  const json = fs.readFileSync(relativePath(name + '.json', eventsDir), 'utf8');

  return JSON.parse(json);
}

const apiResultsDir = relativePath('./fixtures/filters/api-results/', import.meta.url);

function loadApiResult(name) {
  const json = fs.readFileSync(relativePath(name + '.json', apiResultsDir), 'utf8');

  return JSON.parse(json);
}