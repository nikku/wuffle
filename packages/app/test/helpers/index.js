import { AsyncInjector } from 'async-didi';

import Columns from 'wuffle/lib/columns.js';
import AsyncEvents from 'wuffle/lib/events.js';
import Store from 'wuffle/lib/store.js';

import { expect } from 'chai';

import MockLogger from '../mocks/MockLogger.js';
import MockWebhookEvents from '../mocks/MockWebhookEvents.js';


const defaultConfig = {
  name: 'test',
  columns: [
    { name: 'Inbox', label: null },
    { name: 'Backlog', label: 'backlog' },
    { name: 'Ready', label: 'ready' },
    { name: 'In Progress', label: 'in progress' },
    { name: 'Needs Review', label: 'needs review' },
    { name: 'Done', label: null, closed: true }
  ]
};

export async function bootstrap(options) {

  const {
    config: extraConfig = {},
    additionalModules: additionalModules = []
  } = options;

  const config = {
    ...defaultConfig,
    ...extraConfig
  };

  const events = new AsyncEvents();

  const coreModule = {
    'config': [ 'value', config ],
    'columns': [ 'type', Columns ],
    'store': [ 'type', Store ],
    'events': [ 'value', events ],
    'logger': [ 'type', MockLogger ],
    'webhookEvents': [ 'type', MockWebhookEvents ]
  };

  const injector = new AsyncInjector([
    coreModule,
    ...additionalModules
  ]);

  // initialize modules ////////////

  await injector.init();

  return injector;
}

/**
 * @param {Store} store
 * @param {any} issueMatcher
 */
export function expectIssue(store, issueMatcher) {
  const issues = store.getIssues();

  expect(issues).to.containSubset([ issueMatcher ]);
}

/**
 * @param {Store} store
 * @param {any} issueMatcher
 */
export function expectNoIssue(store, issueMatcher) {
  const issues = store.getIssues();

  expect(issues).not.to.containSubset([ issueMatcher ]);
}