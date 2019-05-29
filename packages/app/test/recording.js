const { expect } = require('chai');

const fs = require('fs');

const FIXTURE_BASE = `${__dirname}/fixtures`;

const { Application } = require('probot');

const MergeMe = require('..');

function ApiCall(name) {
  return Entry('api-call', name);
}

function Event(name) {
  return Entry('event', name);
}

function Entry(type, name) {
  return `${type}:${name}`;
}

class Recording {

  constructor(entries, options = {}) {
    this.entries = entries;
    this.idx = 0;

    this.debug = options.debug;
  }

  /**
   * Trace log given message
   */
  trace(msg) {
    if (this.debug) {
      console.log(msg);
    }
  }

  /**
   * Setup and replay recording.
   */
  async replay() {
    this.setup();

    await this.tick();

    expect(this.peek()).not.to.exist;
  }

  /**
   * Setup recording for replay.
   */
  setup() {
    const github = ReplayingGithub(this);

    const app = new Application();
    app.auth = () => Promise.resolve(github);
    app.load(MergeMe);

    // disable logging unless debug is configured
    if (!this.debug) {
      app.log = () => {};
      app.log.child = () => app.log;
      app.log.error = app.log.debug = app.log;
    }

    this.app = app;
  }

  /**
   * Start simulation by draining the next
   * event on in the recording stream.
   */
  async tick() {

    let entry;

    while ((entry = this.peek())) {

      const {
        type,
        name
      } = entry;

      if (type !== 'event') {
        throw new Error(`expected <${Event('*')}>, found <${Entry(type, name)}>`);
      }

      // remove entry from top of recording
      const {
        payload
      } = this.pop();

      this.trace(`replaying <${Entry(type, name)}>`);

      await this.app.receive({
        name,
        payload
      });
    }

  }

  /**
   * Get next recorded entry, advancing the recording.
   *
   * @return {Object} entry
   */
  pop() {
    return this.entries[this.idx++];
  }

  /**
   * Get next recorded entry without advancing the entry state.
   *
   * @return {Object} entry
   */
  peek() {
    return this.entries[this.idx];
  }

}


function loadRecording(name, options) {

  const dir = `${FIXTURE_BASE}/${name}`;

  const entryNames = fs.readdirSync(dir);

  const entries = entryNames.sort().map(function(entryName) {

    try {
      return JSON.parse(fs.readFileSync(`${dir}/${entryName}`, 'utf-8'));
    } catch (e) {
      throw new Error(`failed to parse ${dir}/${entryName}: ${e.message}`);
    }
  });

  return new Recording(entries, options);
}


// replay helpers //////////////////////////////

function ReplayingGithub(recording) {

  function ReplayingHandlerMethod(handlerName, methodName) {

    const recordName = `${handlerName}.${methodName}`;

    return async function(actualArgs) {

      // assume there is a next entry
      const entry = recording.pop();

      if (!entry) {
        throw new Error(`expected <end of recording>, found <${ApiCall(recordName)}>`);
      }

      const {
        type,
        name,
        args: expectedArgs,
        result
      } = entry;

      if (name !== recordName || type !== 'api-call') {
        throw new Error(`expected <${Entry(type, name)}>, found <${ApiCall(recordName)}>`);
      }

      recording.trace(`replaying <${Entry(type, name)}>`);

      expect(actualArgs).to.eql(expectedArgs);

      const {
        error,
        data
      } = result;

      if (error) {
        throw error;
      }

      return {
        data
      };
    };

  }

  function ReplayingHandler(handlerName) {

    return new Proxy({}, {
      get: function(target, prop) {
        return ReplayingHandlerMethod(handlerName, prop);
      }
    });

  }

  return new Proxy({}, {
    get: function(target, prop) {
      return new ReplayingHandler(prop);
    }
  });

}

module.exports = {
  loadRecording
};