import { expect } from 'chai';
import sinon from 'sinon';

import AsyncEvents from 'wuffle/lib/events.js';
import GithubApp from 'wuffle/lib/apps/github-app/GithubApp.js';


const AllRequiredEvents = [
  'check_run',
  'create',
  'issues',
  'issue_comment',
  'label',
  'member',
  'milestone',
  'pull_request',
  'pull_request_review',
  'repository',
  'status',
  'sub_issues'
];


describe('apps/github-app', function() {

  let warnSpy, errorSpy, events;

  function createGithubApp(options = {}) {
    const {
      appEvents = AllRequiredEvents,
      installations = []
    } = options;

    const logger = {
      child() { return this; },
      warn: warnSpy,
      error: errorSpy,
      debug() {},
      info() {}
    };

    const mockOctokit = {
      rest: {
        apps: {
          getAuthenticated() {
            return Promise.resolve({ data: { events: appEvents } });
          },
          listInstallations: {}
        }
      },
      paginate() {
        return Promise.resolve(installations);
      }
    };

    const mockApp = {
      auth() {
        return Promise.resolve(mockOctokit);
      }
    };

    const mockInjector = {
      get() {
        return Promise.resolve({ on() {} });
      }
    };

    return new GithubApp({}, /** @type {any} */ (mockApp), /** @type {any} */ (logger), /** @type {any} */ (mockInjector), events);
  }

  function createInstallation(overrides = {}) {
    return {
      id: 1,
      account: { login: 'test-org' },
      permissions: {
        checks: 'read',
        contents: 'read',
        issues: 'write',
        metadata: 'read',
        pull_requests: 'write',
        statuses: 'read'
      },
      events: AllRequiredEvents,
      ...overrides
    };
  }

  beforeEach(function() {
    warnSpy = sinon.spy();
    errorSpy = sinon.spy();
    events = new AsyncEvents();
  });


  describe('validateApp', function() {

    it('should log error if app is missing required event subscriptions', async function() {

      // given
      createGithubApp({ appEvents: [ 'issues', 'pull_request' ] });

      // when
      await events.emit('wuffle.start');

      // then
      expect(errorSpy).to.have.been.calledWithMatch(
        sinon.match.has('missingEvents'),
        'app is missing required event subscriptions; update app settings on GitHub'
      );
    });


    it('should not log error if app has all required event subscriptions', async function() {

      // given
      createGithubApp({ appEvents: AllRequiredEvents });

      // when
      await events.emit('wuffle.start');

      // then
      expect(errorSpy).not.to.have.been.called;
    });

  });


  describe('validateInstallation', function() {

    it('should warn if installation is missing required event subscriptions', async function() {

      // given
      const githubApp = createGithubApp({
        installations: [ createInstallation({ events: [ 'issues', 'pull_request' ] }) ]
      });

      // when
      await githubApp.getInstallations();

      // then
      expect(warnSpy).to.have.been.calledWithMatch(
        sinon.match.has('missingEvents'),
        'missing required event subscriptions'
      );
    });


    it('should not warn if installation has all required event subscriptions', async function() {

      // given
      const githubApp = createGithubApp({
        installations: [ createInstallation({ events: AllRequiredEvents }) ]
      });

      // when
      await githubApp.getInstallations();

      // then
      expect(warnSpy).not.to.have.been.called;
    });

  });

});
