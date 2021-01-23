const { Server, Probot } = require('probot');

const { getLog } = require('probot/lib/helpers/get-log');
const { setupAppFactory } = require('probot/lib/apps/setup');

const { getErrorHandler } = require('probot/lib/helpers/get-error-handler');
const { getPrivateKey } = require('@probot/get-private-key');


/**
 * A stub for proper programmatic usage of probot.
 *
 * @type {Object}
 */
const CustomProbot = {

  async run(appFn) {

    const appId = parseInt(process.env.APP_ID, 10);
    const host = process.env.HOST || 'localhost';
    const port = parseInt(process.env.PORT || '3000', 10);
    const privateKey = getPrivateKey() || undefined;

    const log = getLog();

    const server = new Server({
      host,
      log: log.child({ name: 'wuffle:server' }),
      port,
      webhookPath: process.env.WEBHOOK_PATH,
      webhookProxy: process.env.WEBHOOK_PROXY_URL,
      Probot: Probot.defaults({
        appId,
        log: log.child({ name: 'wuffle:probot' }),
        privateKey,
        secret: process.env.WEBHOOK_SECRET
      })
    });

    // use probots own setup app if the probot app
    // is not configured yet
    if (!appId || !privateKey) {
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
};

module.exports = CustomProbot;