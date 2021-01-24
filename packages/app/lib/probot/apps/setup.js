const bodyParser = require('body-parser');
const updateDotenv = require('update-dotenv');

const { ManifestCreation } = require('../manifest-creation');

const { getLoggingMiddleware } = require('probot/lib/server/logging-middleware');

const { getLog } = require('probot/lib/helpers/get-log');

const { randomString } = require('../../util');


function setupAppFactory(host, port) {

  return async function setupApp(app, { getRouter }) {
    const setup = new ManifestCreation();

    const log = getLog().child({ name: 'wuffle:setup' });

    if (process.env.NODE_ENV !== 'production' && !process.env.WEBHOOK_PROXY_URL) {
      await setup.createWebhookChannel();
    }

    if (!process.env.SESSION_SECRET) {
      await setup.updateEnv({
        SESSION_SECRET: randomString()
      });
    }

    const route = getRouter();

    route.use(getLoggingMiddleware(app.log));

    route.get('/probot', async (req, res) => {
      const baseUrl = getBaseUrl(req);
      const pkg = setup.pkg;
      const manifest = setup.getManifest(pkg, baseUrl);
      const createAppUrl = setup.createAppUrl;

      // Pass the manifest to be POST'd
      res.render('setup.hbs', { pkg, createAppUrl, manifest });
    });

    route.get('/probot/setup', async (req, res) => {
      const { code } = req.query;
      const app_url = await setup.createAppFromCode(code);

      log.info('Setup completed, please start the app');

      res.send(renderSuccess(app_url + '/installations/new'));
    });

    route.get('/probot/import', async (_req, res) => {
      const { WEBHOOK_PROXY_URL, GHE_HOST } = process.env;
      const GH_HOST = `https://${GHE_HOST ?? 'github.com'}`;
      res.render('import.hbs', { WEBHOOK_PROXY_URL, GH_HOST });
    });

    route.post('/probot/import', bodyParser.json(), async (req, res) => {
      const { appId, pem, webhook_secret } = req.body;
      if (!appId || !pem || !webhook_secret) {
        res.status(400).send('appId and/or pem and/or webhook_secret missing');
        return;
      }
      await updateDotenv({
        APP_ID: appId,
        PRIVATE_KEY: `"${pem}"`,
        WEBHOOK_SECRET: webhook_secret
      });

      log.info('Setup completed, please start the app');

      res.send(renderSuccess());
    });

    route.get('/', (req, res, next) => res.redirect('/probot'));
  };
}

module.exports = {
  setupAppFactory
};

function getBaseUrl(req) {
  const protocols = req.headers['x-forwarded-proto'] || req.protocol;
  const protocol =
    typeof protocols === 'string' ? protocols.split(',')[0] : protocols[0];
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = `${protocol}://${host}`;
  return baseUrl;
}


function renderSuccess(appUrl=null) {

  return `
<!DOCTYPE html>
<html lang="en" class="height-full">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Setup Wuffle App | built with Probot</title>
    <link rel="icon" href="/probot/static/probot-head.png">
    <link rel="stylesheet" href="/probot/static/primer.css">
  </head>
  <body class="height-full bg-gray-light">
    <div class="d-flex flex-column flex-justify-center flex-items-center text-center height-full">
      <img src="/probot/static/robot.svg" alt="Probot Logo" width="100" class="mb-6">
      <div class="box-shadow rounded-2 border p-6 bg-white">
        <div class="text-center">
          <h1 class="alt-h2 mb-4">Congrats! You have successfully installed your app!</h1>

          <p class="alt-h3 mb-2">
            You can now ${ appUrl ? `<a href="${appUrl}" target="_blank" rel="no-opener">` : ''}
              connect GitHub repositories
            ${appUrl ? '</a>' : ''} to your board.
          </p>

          <p class="alt-h3">
            Please restart the server to complete the setup.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

}