import { AsyncInjector } from 'async-didi';

import Columns from 'wuffle/lib/columns.js';

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

const fakeConfig = {
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

const fakeModule = {
  logger: [ 'type', FakeLogger ],
  config: [ 'value', fakeConfig ],
  columns: [ 'type', Columns ]
};

export async function bootstrap(options) {

  const modules = [
    fakeModule,
    ...options.modules
  ];

  const injector = new AsyncInjector(modules);

  // initialize modules ////////////

  for (const module of modules) {

    const init = module.__init__ || [];

    for (const component of init) {
      await injector[typeof component === 'function' ? 'invoke' : 'get'](component);
    }

  }

  return injector;
}