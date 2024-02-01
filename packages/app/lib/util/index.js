import crypto from 'node:crypto';
import fs from 'node:fs';

export { Cache, NoopCache } from './cache.js';

export { findLinks, linkTypes } from './links.js';

export { parseSearch, parseTemporalFilter } from './search.js';

export { default as preExit } from 'prexit';

export { repoAndOwner, issueIdent } from './meta.js';

export function randomString(length = 64) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * @param {string} str
 *
 * @return {string}
 */
export function hash(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * @param {string|URL} path
 * @param {string|URL} baseUrl
 *
 * @return {URL}
 */
export function relativePath(path, baseUrl) {
  return new URL(path, baseUrl);
}

export function getPackageVersion() {

  const { version } = JSON.parse(
    fs.readFileSync(relativePath('../../package.json', import.meta.url), 'utf8')
  );

  return version;
}