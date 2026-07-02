import fs from 'node:fs';
import path from 'node:path';

import Express from 'express';

import yaml from 'yaml';
import dotenv from 'dotenv';

import { run as probotRun } from 'probot';

import { getLog } from '../log.js';

import { randomString } from '../util/index.js';

/**
 * @typedef { Parameters<typeof probotRun>[1] } RunOptions
 */

/**
 * Start wuffle by delegating to probot's own `run`, which boots a probot
 * `Server` (handling GitHub webhooks, smee proxy, static assets and, when the
 * app is not configured yet, the first time setup flow).
 *
 * We contribute two wuffle specific bits: an Express router bridge (so our
 * router based apps keep working on top of probot's raw `addHandler` API)
 * and an `updateEnv` hook that generates a `SESSION_SECRET` and prints a
 * restart message once the GitHub App has been set up.
 *
 * @param { import('probot').ApplicationFunction } appFn
 * @param { RunOptions } [additionalOptions]
 *
 * @return { Promise<void> }
 */
export async function run(appFn, additionalOptions) {

  const env = additionalOptions?.env || process.env;

  const log = await getLog({
    level: env.LOG_LEVEL,
    logFormat: env.LOG_FORMAT === 'json' ? 'json' : undefined,
    logMessageKey: env.LOG_MESSAGE_KEY,
    sentryDsn: env.SENTRY_DSN
  });

  // log all unhandled rejections
  process.on('unhandledRejection', reason => log.error(reason));

  await probotRun(withExpressRouter(appFn, env), {
    ...additionalOptions,
    log,
    updateEnv(updates) {

      // `updateEnv` is also called for intermediate steps (e.g. the smee
      // channel); only the app creation carries the APP_ID
      if (updates.APP_ID && !process.env.SESSION_SECRET) {
        updates.SESSION_SECRET = randomString();
      }

      const result = updateEnv(updates);

      if (updates.APP_ID) {
        log.warn('Setup completed, please restart Wuffle to complete the setup');
      }

      return result;
    }
  });
}

/**
 * Wrap an Express based wuffle app so it can be loaded by probot's `Server`,
 * which hands apps a raw `addHandler((req, res) => ...)` API instead.
 *
 * We mount a single Express app as one probot handler; Express invokes its
 * `next` callback when no route matches, letting probot fall through to its own
 * (not-found / static) handlers.
 *
 * @param { import('probot').ApplicationFunction } appFn
 * @param { NodeJS.ProcessEnv } env
 *
 * @return { import('probot').ApplicationFunction }
 */
function withExpressRouter(appFn, env) {

  /**
   * @param { import('probot').Probot } probot
   * @param { import('probot').ApplicationFunctionOptions } options
   *
   * @return { void | Promise<void> }
   */
  return (probot, options) => {

    const expressApp = Express();

    // trust the reverse proxy (X-Forwarded-* headers) when configured to
    if (env.TRUST_PROXY) {
      expressApp.set('trust proxy', true);
    }

    const router = Express.Router();

    expressApp.use(router);

    options.addHandler((req, res) => /** @type { Promise<boolean> } */ (new Promise((resolve, reject) => {
      res.on('finish', () => resolve(true));
      res.on('close', () => resolve(true));

      expressApp(/** @type { any } */ (req), /** @type { any } */ (res), err => err ? reject(err) : resolve(false));
    })));

    // provide the Express router the wuffle app (and its child apps via DI)
    // register their routes on
    return appFn(probot, /** @type { any } */ ({
      ...options,
      router
    }));
  };
}

export function isProduction(env = process.env) {
  return env.NODE_ENV === 'production';
}

export function isSetup(env = process.env) {
  return !!(env.APP_ID && (env.PRIVATE_KEY || env.PRIVATE_KEY_PATH));
}

export function validateSetup() {

  const pkg = JSON.parse(
    fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  );

  let manifest = {};

  try {
    manifest = yaml.parse(
      fs.readFileSync(path.join(process.cwd(), 'app.yml'), 'utf8')
    ) || {};
  } catch (error) {

    // app config does not exist, which is ok
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const url = manifest.url || pkg.homepage || pkg.repository;
  const name = process.env.PROJECT_DOMAIN || manifest.name || pkg.name;

  return [
    !url && new Error('No <url> configured in app.yml'),
    !name && new Error('No <name> configured in app.yml')
  ].filter(e => e);
}

/**
 * Persist the given values to the `.env` file in the current working directory,
 * merging them with any already present values, and update `process.env`.
 *
 * @param { Record<string, string | undefined> } env
 *
 * @return { Record<string, string | undefined> }
 */
function updateEnv(env) {
  const envPath = path.join(process.cwd(), '.env');

  let existing = {};

  try {
    existing = dotenv.parse(fs.readFileSync(envPath));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  env = { ...existing, ...env };

  const contents = Object.keys(env)
    .map(key => `${key}=${String(env[key]).replace(/\n/g, '\\n')}`)
    .join('\n');

  fs.writeFileSync(envPath, contents);

  Object.assign(process.env, env);

  return env;
}