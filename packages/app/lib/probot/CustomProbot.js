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

  const serverOptions = {
    host,
    log: log.child({ name: 'server' }),
    port,
    webhookPath: process.env.WEBHOOK_PATH,
    webhookProxy: process.env.WEBHOOK_PROXY_URL
  };

  let probotOptions = {
    appId,
    log: log.child({ name: 'probot' }),
    privateKey,
    secret: process.env.WEBHOOK_SECRET
  };

  // use probots own setup app if the probot app
  // is not configured yet
  if (!isProduction() && !isSetup()) {

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

  const server = new Server({
    ...serverOptions,
    Probot: Probot.defaults({
      ...probotOptions
    })
  });

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