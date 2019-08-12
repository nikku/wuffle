function WebhookEvents(app) {

  /**
   * Register a event lister for a single
   * or a number of webhook events.
   *
   * @param {String|Array<String>} events
   * @param {Function} fn listener
   */
  function on(events, fn) {
    app.on(events, fn);
  }

  // api /////////////////

  this.on = on;

}

module.exports = WebhookEvents;