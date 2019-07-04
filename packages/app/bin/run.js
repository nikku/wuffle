#!/usr/bin/env node

require('dotenv').config();

const { Probot } = require('probot');

// validate ///////////

const NODE_ENV = process.env.NODE_ENV || 'development';

const IS_PROD = NODE_ENV === 'production';

const problems = [
  checkEnv('APP_ID', IS_PROD),
  checkEnv('PRIVATE_KEY', IS_PROD),
  checkEnv('WEBHOOK_SECRET', IS_PROD),
  checkEnv('GITHUB_CLIENT_ID', IS_PROD),
  checkEnv('GITHUB_CLIENT_SECRET', IS_PROD),
  checkEnv('SESSION_SECRET', IS_PROD),
  checkConfig()
].filter(problem => problem);

function isFatal(problem) {
  return problem.type === 'ERROR';
}

function checkConfig() {

  if (process.env.BOARD_CONFIG) {
    try {
      JSON.parse(process.env.BOARD_CONFIG);

      // we cool!
      return;
    } catch (err) {
      return error(`Failed to parse env.BOARD_CONFIG as JSON: ${err.message}`);
    }
  }

  try {
    require('../wuffle.config.js');
  } catch (err) {
    return error('Board not configured via env.BOARD_CONFIG or wuffle.config.js');
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

  console.warn(`Found ${ fatal ? '' : 'potential'} configuration issues:\n`);

  for (const problem of problems) {
    console[isFatal(problem) ? 'error' : 'warn'](`${problem.type}\t${problem.message}`);
  }

  console.warn();

  if (fatal) {
    console.error('Exiting due to ERROR(s)');
    process.exit(1);
  }
}


// run /////////

const app = require('../');

Probot.run(app);