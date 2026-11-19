import { expect } from 'chai';

import express from 'express';

import fs from 'node:fs';

import { relativePath } from 'wuffle/lib/util/index.js';

import { bootstrap } from '../../helpers/index.js';

import BoardApiRoutesModule from 'wuffle/lib/apps/board-api-routes/index.js';
import SearchModule from 'wuffle/lib/apps/search/index.js';

import MockGithubIssues from '../../mocks/MockGithubIssues.js';


describe('board-api-routes', function() {

  let server, baseUrl, store;

  beforeEach(async function() {

    const router = express.Router();

    const app = await bootstrap({
      additionalModules: [
        SearchModule,
        {
          router: [ 'value', router ],
          githubClient: [ 'value', {} ],
          githubIssues: [ 'type', MockGithubIssues ],
          authRoutes: [ 'value', {
            getGitHubUser: () => null
          } ],
          userAccess: [ 'value', {
            getReadFilter: async () => () => true
          } ]
        },
        BoardApiRoutesModule
      ]
    });

    store = await app.get('store');

    await new Promise(resolve => {
      server = express().use(router).listen(0, resolve);
    });

    baseUrl = `http://localhost:${server.address().port}`;
  });

  afterEach(function() {
    server.close();
  });


  it('should list all columns in board order', async function() {

    // given
    await store.updateIssue({
      ...loadFixture('issues')[0],
      column: 'Ready'
    });

    // when
    const response = await fetch(`${baseUrl}/wuffle/board/cards`);
    const { items } = await response.json();

    // then
    expect(Object.keys(items)).to.eql([
      'Inbox', 'Backlog', 'Ready', 'In Progress', 'Needs Review', 'Done'
    ]);

    expect(items.Inbox).to.eql([]);
    expect(items.Ready).to.have.length(1);
  });

});


// helpers /////////////

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(relativePath(name + '.json', import.meta.url), 'utf-8'));
}
