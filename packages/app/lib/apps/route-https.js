const {
  useHttps
} = require('../middleware');

/**
 * Enables https redirects and strict transport security.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  if (!process.env.FORCE_HTTPS) {
    return;
  }

  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error('must configure BASE_URL to force https');
  }

  if (!baseUrl.startsWith('https://')) {
    throw new Error('BASE_URL must start with https');
  }

  app.router.use(useHttps(baseUrl));
};