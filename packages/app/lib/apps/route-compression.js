const compression = require('compression');

/**
 * Enables compression for routes
 *
 * @param {Router} router
 */
module.exports = function(router) {

  router.use(compression());

};