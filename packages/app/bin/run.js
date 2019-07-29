#!/usr/bin/env node

require('dotenv').config();

const { Probot } = require('probot');

const { logger } = require('probot/lib/logger');
const { wrapLogger } = require('probot/lib/wrap-logger');

const log = wrapLogger(logger, logger).child({
  name: 'wuffle:run'
});

const Columns = require('../lib/columns');

const { version } = require('../package');

const NODE_ENV = process.env.NODE_ENV || 'development';

const IS_PROD = NODE_ENV === 'production';
const IS_DEV = NODE_ENV === 'development';


// shim

if (typeof Array.prototype.flat !== 'function') {
  Array.prototype.flat = function() {
    return [].concat(...this);
  };
}

async function validate() {

  log.info('Validating configuration');

  const problems = [
    checkEnv('APP_ID', IS_PROD),
    checkEnv('PRIVATE_KEY', IS_PROD),
    checkEnv('WEBHOOK_SECRET', IS_PROD),
    checkEnv('GITHUB_CLIENT_ID', IS_PROD),
    checkEnv('GITHUB_CLIENT_SECRET', IS_PROD),
    checkEnv('SESSION_SECRET', IS_PROD),
    checkEnv('BASE_URL', IS_PROD),
    checkConfig(),
    checkBaseUrl()
  ].flat().filter(problem => problem);

  function isFatal(problem) {
    return problem.type === 'ERROR';
  }

  function checkBaseUrl() {

    const baseUrl = process.env.BASE_URL;

    if (baseUrl) {
      if (baseUrl.includes('/board')) {
        return error('env.BASE_URL must point to the root of the webapp');
      }

      if (!baseUrl.startsWith('http')) {
        return error('env.BASE_URL must start with protocol (http/https)');
      }

      if (baseUrl.endsWith('/')) {
        return error('env.BASE_URL must not end with trailing slash');
      }
    }
  }

  function checkConfigName(config) {
    const problem = IS_PROD ? error : warning;

    if (!config.name) {
      return problem('missing config.name');
    }
  }

  function checkConfigColumns(config) {

    if (!config.columns) {
      return error('missing config.columns');
    }

    try {
      new Columns(config.columns);
    } catch (error) {
      // always an error, regardless of PROD / DEV
      return error(error.message);
    }
  }

  function checkConfigValues(config) {

    return [
      checkConfigName(config),
      checkConfigColumns(config)
    ];

  }

  function checkConfig() {

    const problem = IS_PROD ? error : warning;

    let config;

    if (process.env.BOARD_CONFIG) {
      try {
        config = JSON.parse(process.env.BOARD_CONFIG);
      } catch (err) {
        return problem(`Failed to parse env.BOARD_CONFIG as JSON: ${err.message}`);
      }
    }

    if (!config) {
      try {
        config = require('../wuffle.config.js');
      } catch (err) {
        return problem('Board not configured via env.BOARD_CONFIG or wuffle.config.js');
      }
    }

    if (config) {
      return checkConfigValues(config);
    }
  }

  function checkEnv(key, isError=false) {

    if (!process.env[key]) {
      return (isError ? error : warning)(
        `Missing env.${key}`
      );
    }
  }

  function error(message) {
    return {
      type: 'ERROR',
      message
    };
  }

  function warning(message) {
    return {
      type: 'WARN',
      message
    };
  }

  const fatal = problems.some(isFatal);

  if (problems.length) {

    for (const problem of problems) {
      log[isFatal(problem) ? 'error' : 'warn'](problem.message);
    }

    log[fatal ? 'error' : 'warn']('Please refer to https://wuffle.dev for setup instructions');

    if (fatal) {
      log.error('Exiting due to error(s)');
      process.exit(1);
    }
  }
}

async function start() {

  log.info(`Starting Wuffle v${version}`);

  const app = require('../');

  await Probot.run(app);
}

async function open() {

  if (IS_DEV) {
    const url = process.env.BASE_URL || 'http://localhost:3000';

    log.info(`
Wuffle started on ${url}
`);
  }
}

async function run() {
  await validate();
  await start();
  await open();
}

run().catch(err => {
  log.error(err);

  process.exit(1);
});