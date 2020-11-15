const mkdirp = require('mkdirp');

const path = require('path');
const fs = require('fs');


/**
 * This component adds the #onActive method to subscribe to events
 * for explicitly activated repositories only.
 *
 * @param {import("../types").Logger} logger
 * @param {import("./webhook-events/WebhookEvents")} webhookEvents
 */
module.exports = function(logger, webhookEvents) {

  if (
    !(process.env.NODE_ENV === 'development' || process.env.LOG_WEBHOOK_EVENTS)
  ) {
    return;
  }

  const log = logger.child({
    name: 'wuffle:log-events'
  });

  const eventsDir = 'tmp/events';

  let counter = 0;


  function write(event, payload) {

    const {
      action
    } = payload;

    const name = action ? `${event}.${action}` : event;

    const data = JSON.stringify({ event, payload }, null, '  ');

    return new Promise((resolve, reject) => {

      mkdirp(eventsDir, function(err) {

        if (err) {
          reject(err);
        } else {

          const fileName = path.join(eventsDir, `${Date.now()}-${counter++}-${name}.json`);

          fs.writeFile(fileName, data, 'utf8', function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });

  }


  // behavior //////////////////////

  webhookEvents.on('*', async context => {
    const {
      event,
      payload
    } = context;

    write(event, payload).catch(err => {
      log.error('failed to record event', err);
    });
  });

};