import compression from 'compression';

/**
 * Enables compression for routes
 *
 * @param {import('express').Router} router
 */
export default function routeCompression(router) {
  router.use(compression());
}