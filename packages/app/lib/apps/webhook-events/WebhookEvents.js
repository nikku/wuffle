function WebhookEvents(app, githubApp) {

  /**
   * Register a event lister for a single
   * or a number of webhook events.
   *
   * @param {String|Array<String>} events
   * @param {Function} fn listener
   */
  function on(events, fn) {
    app.on(events, async context => {

      const {
        payload
      } = context;

      const {
        installation
      } = payload;

      if (installation) {
        const enabled = await githubApp.isInstallationEnabled(installation);

        if (!enabled) {
          return;
        }
      }

      return fn(context);
    });
  }

  // api /////////////////

  this.on = on;

}

module.exports = WebhookEvents;