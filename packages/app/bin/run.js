#!/usr/bin/env node

require('dotenv').config();

const { CustomProbot } = require('../lib/probot');

const IS_PROD = CustomProbot.isProduction();

const IS_SETUP = !IS_PROD && !CustomProbot.isSetup();

const fs = require('fs');
const path = require('path');

const { getLog } = require('probot/lib/helpers/get-log');

const log = getLog().child({
  name: 'wuffle:run'
});

const Columns = require('../lib/columns');

const { version } = require('../package');

// shim

if (typeof Array.prototype.flat !== 'function') {
  Array.prototype.flat = function() {
    return [].concat(...this);
  };
}

async function validate() {

  log.info('Validating configuration');

  const problems = [
    !IS_PROD ? warning('Not running in production mode') : null,
    checkEnv('APP_ID', IS_PROD),
    checkEnv('BASE_URL', IS_PROD),
    checkEnv('GITHUB_CLIENT_ID', IS_PROD),
    checkEnv('GITHUB_CLIENT_SECRET', IS_PROD),
    checkEnv('PRIVATE_KEY', IS_PROD),
    checkEnv('SESSION_SECRET', IS_PROD),
    checkEnv('WEBHOOK_SECRET', IS_PROD),
    checkDumpConfig(),
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
    const problem = IS_PROD ? error : warning;

    if (!fs.existsSync(path.join(__dirname, '../public/index.html'))) {
      return problem('board assets not found, please compile them via npm run build');
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
      const configPath = path.resolve('wuffle.config.js');

      try {
        config = require(configPath);
      } catch (err) {
        return problem('Board not configured via env.BOARD_CONFIG or wuffle.config.js');
      }
    }

    if (config) {
      return checkConfigValues(config);
    }
  }

  function checkDumpConfig() {
    if (process.env.S3_BUCKET) {
      return [
        checkEnv('AWS_ACCESS_KEY_ID', true),
        checkEnv('AWS_SECRET_ACCESS_KEY', true),
        checkEnv('S3_BUCKET', true),
        checkEnv('S3_REGION', true)
      ];
    }
  }

  function checkEnv(key, isError = false) {

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

    if (!IS_SETUP) {
      log[fatal ? 'error' : 'warn']('Please refer to https://wuffle.dev for configuration and setup instructions');
    }

    if (fatal) {
      log.error('Exiting due to error(s)');
      process.exit(1);
    }
  }
}

async function performSetup() {

  log.info('Running first time setup');

  const configPath = path.resolve('wuffle.config.js');

  if (!process.env.BOARD_CONFIG && !fs.existsSync(configPath)) {
    fs.copyFileSync(path.join(__dirname, '../wuffle.config.example.js'), configPath);

    log.info('Created board config: wuffle.config.js');
  }

  const manifestPath = path.resolve('app.yml');

  if (!fs.existsSync(manifestPath)) {
    fs.copyFileSync(path.join(__dirname, '../app.yml'), manifestPath);

    log.info('Created GitHub App manifest: app.yml');
  }

  log.info('Validating setup');

  const errors = CustomProbot.validateSetup();

  if (errors.length) {
    for (const error of errors) {
      log.error(error.message);
    }

    log.error('Please correct above errors and restart');

    process.exit(1);
  }
}

async function start() {

  const app = require('../');

  const {
    expressApp
  } = await CustomProbot.run(app);

  if (process.env.TRUST_PROXY) {
    expressApp.set('trust proxy', true);
  }
}

async function open() {

  const url = process.env.BASE_URL || 'http://localhost:3000';

  if (IS_SETUP) {
    log.warn(`Visit ${url} to create a GitHub App that connects us to GitHub`);
  } else {
    log.info(`Wuffle started on ${url}`);
  }
}

async function run() {

  log.info(`Running Wuffle v${version} in ${process.cwd()}`);

  if (IS_SETUP) {
    await performSetup();
  }

  await validate();
  await start();
  await open();
}

run().catch(err => {
  log.error(err);

  process.exit(1);
});