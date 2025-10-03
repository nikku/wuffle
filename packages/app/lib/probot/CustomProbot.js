import Express from "express";
import { createNodeMiddleware, createProbot } from "probot";

import { getLog } from 'probot';

import { isProduction } from 'probot/lib/helpers/is-production.js';
import { ManifestCreation } from 'probot/lib/manifest-creation.js';
import { readEnvOptions } from 'probot/lib/bin/read-env-options.js';
import { getErrorHandler } from 'probot/lib/helpers/get-error-handler.js';

import { setupAppFactory } from './apps/setup.js';


async function run(appFn, additionalOptions) {

  const {

    // log options
    logLevel: level, logFormat, logLevelInString, logMessageKey, sentryDsn,

    // server options
    host, port, webhookPath, webhookProxy,

    // probot options
    appId, privateKey, redisConfig, secret, baseUrl

  } = readEnvOptions(additionalOptions?.env);

  const logOptions = {
    level,
    logFormat,
    logLevelInString,
    logMessageKey,
    sentryDsn
  };

  const log = getLog(logOptions);

  const serverOptions = {
    host,
    port,
    webhookPath,
    webhookProxy,
    log: log.child({ name: 'server' })
  };

  let probotOptions = {
    appId,
    privateKey,
    redisConfig,
    secret,
    baseUrl,
    log: log.child({ name: 'probot' })
  };

  // use probots own setup app if the probot app
  // is not configured yet
  if (!isProduction() && !isSetup(probotOptions)) {

    // Workaround for setup (probot/probot#1512)
    // When probot is started for the first time, it gets into a setup mode
    // where `appId` and `privateKey` are not present. The setup mode gets
    // these credentials. In order to not throw an error, we set the values
    // to anything, as the Probot instance is not used in setup it makes no
    // difference anyway.
    probotOptions = {
      ...probotOptions,
      appId: 1,
      privateKey: 'dummy value for setup, see probot/probot#1512'
    };

    appFn = setupAppFactory(host, port);
  }

  const express = Express();

  const middleware = await createNodeMiddleware(appFn, {
    ...serverOptions,
    probot: createProbot({
      overrides: {
        ...probotOptions
      }
    })
  });

  express.use((req, res) => {
    middleware(req, res, () => {
      res.writeHead(404);
      res.end();
    });
  });

  // log all unhandled rejections
  process.on('unhandledRejection', getErrorHandler(serverOptions.log));

  // load apps
  for (const fn of [ appFn ]) {
    await express.use(fn);
  }

  express.listen(serverOptions.port, () => {
    console.log(`Server is running at <http://localhost:${serverOptions.port}`);
  });

  return express;
}

function isSetup(options) {
  const {
    appId,
    privateKey
  } = options || readEnvOptions(process.env);

  return !!(appId && privateKey);
}

function validateSetup() {

  const setup = new ManifestCreation();

  const manifest = JSON.parse(setup.getManifest(setup.pkg, process.env.BASE_URL));

  return [
    !manifest.url && new Error('No <url> configured in app.yml'),
    !manifest.name && new Error('No <name> configured in app.yml')
  ].filter(e => e);
}

export {
  run,
  isSetup,
  isProduction,
  validateSetup
};