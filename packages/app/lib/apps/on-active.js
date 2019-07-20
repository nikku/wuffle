/**
 * This component adds the #onActive method to subscribe to events
 * for explicitly activated repositories only.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  // NOTE: this is a noop, since we dropped config.repositories

  // api ////////////////////

  app.onActive = app.on;

};