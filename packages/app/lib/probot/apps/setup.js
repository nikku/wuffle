import bodyParser from 'body-parser';
import updateDotenv from 'update-dotenv';

import { ManifestCreation } from 'probot/lib/manifest-creation.js';
import { getLoggingMiddleware } from 'probot/lib/server/logging-middleware.js';
import { getLog } from 'probot/lib/helpers/get-log.js';
import { importView } from 'probot/lib/views/import.js';
import { setupView } from 'probot/lib/views/setup.js';

import { randomString } from '../../util/index.js';

export function setupAppFactory(host, port) {

  return async function setupApp(app, { getRouter }) {
    const setup = new ManifestCreation();

    const log = getLog().child({ name: 'wuffle:setup' });

    if (!(
      process.env.NODE_ENV === 'production' ||
      process.env.WEBHOOK_PROXY_URL ||
      process.env.NO_SMEE_SETUP === 'true'
    )) {
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
      const baseUrl = process.env.BASE_URL || getBaseUrl(req);
      const pkg = setup.pkg;
      const manifest = setup.getManifest(pkg, baseUrl);
      const createAppUrl = setup.createAppUrl;

      await setup.updateEnv({
        BASE_URL: baseUrl
      });

      // Pass the manifest to be POST'd
      res.writeHead(200, { 'content-type': 'text/html' }).end(setupView({
        name: pkg.name || 'Wuffle',
        version: pkg.version,
        description: pkg.description,
        createAppUrl,
        manifest
      }));
    });

    route.get('/probot/setup', async (req, res) => {
      const { code } = req.query;

      if (!code || typeof code !== 'string' || code.length === 0) {
        return res
          .writeHead(400, { 'content-type': 'text/plain' })
          .end('code missing or invalid');
      }

      const response = await setup.createAppFromCode(code, {
        request: app.state.request
      });

      const appUrl = app.state.appUrl = `${response}/installations/new`;

      log.warn('Setup completed, please restart the app');

      log.info(`Visit ${appUrl} to connect GitHub repositories`);

      const location = '/probot/success';

      return res
        .writeHead(302, {
          'content-type': 'text/plain',
          location
        })
        .end(`Redirecting to ${ location }`);
    });

    route.get('/probot/import', async (_req, res) => {

      const pkg = setup.pkg;
      const { WEBHOOK_PROXY_URL, GHE_HOST } = process.env;
      const GH_HOST = `https://${GHE_HOST ?? 'github.com'}`;

      return res
        .writeHead(200, {
          'content-type': 'text/html'
        })
        .end(importView({
          name: pkg.name || 'Wuffle',
          WEBHOOK_PROXY_URL,
          GH_HOST
        }));
    });

    route.post('/probot/import', bodyParser.json(), async (req, res) => {
      const { appId, pem, webhook_secret } = req.body;
      if (!appId || !pem || !webhook_secret) {
        return res
          .writeHead(400, {
            'content-type': 'text/plain'
          })
          .end('appId and/or pem and/or webhook_secret missing');
      }

      await updateDotenv({
        APP_ID: appId,
        PRIVATE_KEY: `"${pem}"`,
        WEBHOOK_SECRET: webhook_secret
      });

      log.warn('Setup completed, please restart the app.');

      return res.redirect('/probot/success');
    });

    route.get('/probot/success', (_req, res) => {
      const pkg = setup.pkg;

      const appUrl = app.state.appUrl;

      return res
        .writeHead(200, { 'content-type': 'text/html' })
        .end(successView({
          name: pkg.name || 'Wuffle',
          appUrl
        }));
    });

    route.get('/', (_req, res) => {
      return res
        .writeHead(302, { 'content-type': 'text/plain', location: '/probot' })
        .end();
    });
  };
}

function getBaseUrl(req) {
  const protocols = req.headers['x-forwarded-proto'] || req.protocol;
  const protocol =
    typeof protocols === 'string' ? protocols.split(',')[0] : protocols[0];
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = `${protocol}://${host}`;
  return baseUrl;
}

function successView({ name, appUrl }) {

  return `
  <!DOCTYPE html>
  <html lang="en" class="height-full" data-color-mode="auto" data-light-theme="light" data-dark-theme="dark">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>${ name } Setup complete</title>
      <link rel="icon" href="/probot/static/probot-head.png">
      <link rel="stylesheet" href="/probot/static/primer.css">
    </head>
    <body class="height-full bg-gray-light">
      <div class="d-flex flex-column flex-justify-center flex-items-center text-center height-full">
        <img src="/probot/static/robot.svg" alt="Probot Logo" width="100" class="mb-6">
        <div class="box-shadow rounded-2 border p-6 bg-white">
          <div class="text-center">
            <h1 class="alt-h3 mb-2">You completed your ${name} setup!</h1>

            <p class="mb-2">
              Go ahead and ${ appUrl ? `<a href="${appUrl}" target="_blank" rel="no-opener">` : ''}
                connect GitHub repositories
              ${appUrl ? '</a>' : ''} to your board.
            </p>

            <p>
              Please restart the server to complete the setup.
            </p>

          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}