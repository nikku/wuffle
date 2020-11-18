#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { Probot } = require('../lib/probot');

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
    checkBoardAssets(),
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

    if (config.allowedOrgs && !Array.isArray(config.allowedOrgs)) {
      return problem('config.allowedOrgs must be String[]');
    }
  }

  function checkConfigColumns(config) {

    if (!config.columns) {
      return error('missing config.columns');
    }

    try {
      new Columns(config.columns);
    } catch (err) {

      // always an error, regardless of PROD / DEV
      return error(err.message);
    }
  }

  function checkConfigValues(config) {

    return [
      checkConfigName(config),
      checkConfigColumns(config)
    ];

  }

  function checkBoardAssets() {

    if (!fs.existsSync(path.join(__dirname, '../public/index.html'))) {
      return error('board assets not found, please compile them via npm run build');
    }
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
        config = require(path.resolve('wuffle.config.js'));
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

  log.info('Starting Wuffle');

  const app = require('../');

  const probot = await Probot.run(app);

  if (process.env.TRUST_PROXY) {
    probot.server.set('trust proxy', true);
  }
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

  log.info(`Attempting to run Wuffle v${version} in ${process.cwd()}`);

  await validate();
  await start();
  await open();
}

run().catch(err => {
  log.error(err);

  process.exit(1);
});