/**
 * @typedef { import('probot').Probot } Probot
 * @typedef { import('@octokit/webhooks').EmitterWebhookEventName } WebhookEventName
 */

/**
 * A lightweight wrapper around {@link Probot#on} and {@link Probot#onAny}.
 *
 * @constructor
 *
 * @param {import('../../types.js').ProbotApp} app
 * @param {import('../github-app/GithubApp.js').default} githubApp
 */
export default function WebhookEvents(app, githubApp) {

  /**
   * @param {(context: import('probot').Context) => any} fn
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
   * @template {WebhookEventName} E
   * @param {E | E[]} events
   * @param {(context: import('probot').Context<E>) => any} fn listener
   */
  function on(events, fn) {
    app.on(events, ifEnabled(fn));
  }

  /**
   * Register an event listener for all
   * webhook events.
   *
   * @param {(context: import('probot').Context) => any} fn
   */
  function onAny(fn) {
    app.onAny(ifEnabled(fn));
  }

  // api /////////////////

  this.on = on;
  this.onAny = onAny;
}