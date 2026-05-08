import { AsyncInjector } from 'async-didi';

import Columns from 'wuffle/lib/columns.js';
import AsyncEvents from 'wuffle/lib/events.js';
import Store from 'wuffle/lib/store.js';

function FakeLogger() {

  this.log = function() {};
  this.error = function() {};
  this.info = function() {};
  this.warn = function() {};
  this.debug = function() {};

  this.child = function() {
    return this;
  };
}

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
    'logger': [ 'type', FakeLogger ],
    'columns': [ 'type', Columns ],
    'store': [ 'type', Store ],
    'events': [ 'value', events ]
  };

  const injector = new AsyncInjector([
    coreModule,
    ...additionalModules
  ]);

  // initialize modules ////////////

  await injector.init();

  return injector;
}