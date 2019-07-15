#!/usr/bin/env node

require('dotenv').config();

const { Probot } = require('probot');

const { logger } = require('probot/lib/logger');
const { wrapLogger } = require('probot/lib/wrap-logger');

const log = wrapLogger(logger, logger).child({
  name: 'wuffle:run'
});

const { version } = require('../package');

const NODE_ENV = process.env.NODE_ENV || 'development';

const IS_PROD = NODE_ENV === 'production';
const IS_DEV = NODE_ENV === 'development';


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
  ].filter(problem => problem);

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

  function checkConfig() {

    const problem = IS_PROD ? error : warning;

    if (process.env.BOARD_CONFIG) {
      try {
        JSON.parse(process.env.BOARD_CONFIG);

        // we cool!
        return;
      } catch (err) {
        return problem(`Failed to parse env.BOARD_CONFIG as JSON: ${err.message}`);
      }
    }

    try {
      require('../wuffle.config.js');
    } catch (err) {
      return problem('Board not configured via env.BOARD_CONFIG or wuffle.config.js');
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