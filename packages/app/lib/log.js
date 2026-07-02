/**
 * A pino backed logger, mirroring the (no longer exported) `getLog` helper
 * that probot used to provide.
 *
 * Adapted from probot (MIT licensed):
 * https://github.com/probot/probot/blob/main/src/helpers/get-log.ts
 */

import pino from 'pino';
import { getTransformStream } from '@probot/pino';

/**
 * @param { {
 *   level?: string,
 *   logMessageKey?: string,
 *   logFormat?: 'pretty' | 'json',
 *   logLevelInString?: boolean,
 *   sentryDsn?: string
 * } } [options]
 *
 * @return { Promise<import('pino').Logger> }
 */
export async function getLog(options = {}) {

  const { level, logMessageKey, ...getTransformStreamOptions } = options;

  const pinoOptions = {
    level: level || process.env.LOG_LEVEL || 'info',
    name: 'wuffle',
    messageKey: logMessageKey || 'msg'
  };

  const transform = await getTransformStream(getTransformStreamOptions);
  transform.pipe(/** @type { any } */ (pino.destination(1)));

  return pino(pinoOptions, transform);
}
