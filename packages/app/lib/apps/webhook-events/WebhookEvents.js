/**
 * @constructor
 *
 * @param {import('../../types.js').ProbotApp} app
 * @param {import('../github-app/GithubApp.js').default} githubApp
 */
export default function WebhookEvents(app, githubApp) {

  /**
   * @template {Function} T
   * @param {T} fn
   */
  function ifEnabled(fn) {

    return async (context) => {
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
    };
  }

  /**
   * Register a event lister for a single
   * or a number of webhook events.
   *
   * @param {any|any[]} events
   * @param {Function} fn listener
   */
  function on(events, fn) {
    app.on(events, ifEnabled(fn));
  }

  /**
   * Register an event listener for all
   * webhook events.
   *
   * @param {Function} fn
   */
  function onAny(fn) {
    app.onAny(ifEnabled(fn));
  }

  // api /////////////////

  this.on = on;
  this.onAny = onAny;
}