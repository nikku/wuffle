import { useHttps } from '../middleware/index.js';

/**
 * Enables https redirects and strict transport security.
 *
 * @param {import('express').Router} router
 */
export default function routeHttps(router) {

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

  router.use(useHttps(baseUrl));
}