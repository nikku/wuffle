const { Probot } = require('probot');

const sentryApp = require('probot/lib/apps/sentry');
const setupApp = require('probot/lib/apps/setup');

const { findPrivateKey } = require('probot/lib/private-key');
const { logRequestErrors } = require('probot/lib/middleware/log-request-errors');


/**
 * A stub for proper programmatic usage of probot.
 *
 * @type {Object}
 */
const CustomProbot = {

  run(appFn) {

    const options = {
      cert: findPrivateKey(process.env.PRIVATE_KEY_PATH) || undefined,
      id: parseInt(process.env.APP_ID, 10),
      port: parseInt(process.env.PORT || '3000', 10),
      secret: process.env.WEBHOOK_SECRET,
      webhookPath: process.env.WEBHOOK_PATH,
      webhookProxy: process.env.WEBHOOK_PROXY_URL
    };

    const probot = new Probot(options);

    if (!options.id || !options.cert) {
      probot.load(setupApp);
    } else {

      // log all unhandled rejections
      process.on('unhandledRejection', probot.errorHandler);

      // load apps
      [ sentryApp, appFn ].forEach(appFn => probot.load(appFn));

      // register error handler as the last middleware
      probot.server.use(logRequestErrors);
    }

    probot.start();

    return probot;
  }
};

module.exports.Probot = CustomProbot;