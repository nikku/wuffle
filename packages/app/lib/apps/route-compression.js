const compression = require('compression');

/**
 * Enables compression for routes
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  app.router.use(compression());
};