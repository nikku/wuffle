const compression = require('compression');

/**
 * Enables compression for routes
 *
 * @param {import("express").Router} router
 */
module.exports = function(router) {

  router.use(compression());

};