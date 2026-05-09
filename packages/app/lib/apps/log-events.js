import path from 'node:path';
import { promises as fs } from 'node:fs';


/**
 * This component adds the #onActive method to subscribe to events
 * for explicitly activated repositories only.
 *
 * @constructor
 *
 * @param {import('../types.js').Logger} logger
 * @param {import('./webhook-events/WebhookEvents.js').default} webhookEvents
 */
export default function LogEvents(logger, webhookEvents) {

  if (process.env.NODE_ENV !== 'development' && !process.env.LOG_WEBHOOK_EVENTS) {
    return;
  }

  const log = logger.child({
    name: 'wuffle:log-events'
  });

  const eventsDir = 'tmp/events';

  let counter = 0;

  log.info('dumping webhook events to %s', path.resolve(eventsDir));

  function write(name, payload) {

    const {
      action
    } = payload;

    const eventName = action ? `${name}.${action}` : name;

    const data = JSON.stringify({ name, payload }, null, '  ');

    return fs.mkdir(eventsDir, { recursive: true }).then(() => {
      const fileName = path.join(eventsDir, `${Date.now()}-${counter++}-${eventName}.json`);

      return fs.writeFile(fileName, data, 'utf8');
    });
  }


  // behavior //////////////////////

  webhookEvents.onAny(async context => {
    const {
      name,
      payload
    } = context;

    write(name, payload).catch(err => {
      log.error(err, 'failed to log event');
    });
  });

}