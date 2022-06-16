const { Server, Probot } = require('probot');

const { getLog } = require('probot/lib/helpers/get-log');
const { setupAppFactory } = require('./apps/setup');

const { ManifestCreation } = require('probot/lib/manifest-creation');

const { getErrorHandler } = require('probot/lib/helpers/get-error-handler');
const { getPrivateKey } = require('@probot/get-private-key');


async function run(appFn) {

  const appId = parseInt(process.env.APP_ID, 10);
  const host = process.env.HOST;
  const port = parseInt(process.env.PORT || '3000', 10);
  const privateKey = getPrivateKey() || undefined;

  const log = getLog();

  const server = new Server({
    host,
    log: log.child({ name: 'server' }),
    port,
    webhookPath: process.env.WEBHOOK_PATH,
    webhookProxy: process.env.WEBHOOK_PROXY_URL,
    Probot: Probot.defaults({
      appId,
      log: log.child({ name: 'probot' }),
      privateKey,
      secret: process.env.WEBHOOK_SECRET
    })
  });

  // use probots own setup app if the probot app
  // is not configured yet
  if (!isSetup()) {
    appFn = setupAppFactory(host, port);
  }

  // log all unhandled rejections
  process.on('unhandledRejection', getErrorHandler(server.log));

  // load apps
  for (const fn of [ appFn ]) {
    await server.load(fn);
  }

  await server.start();

  return server;
}

function isSetup() {
  const appId = parseInt(process.env.APP_ID, 10);
  const privateKey = getPrivateKey() || undefined;

  return !!(appId && privateKey);
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function validateSetup() {

  const setup = new ManifestCreation();

  const manifest = JSON.parse(setup.getManifest(setup.pkg));

  return [
    !manifest.url && new Error('No <url> configured in app.yml'),
    !manifest.name && new Error('No <name> configured in app.yml')
  ].filter(e => e);
}

module.exports = {
  run,
  isSetup,
  isProduction,
  validateSetup
};