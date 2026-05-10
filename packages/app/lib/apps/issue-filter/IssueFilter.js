/**
 * @typedef { { ignoreFilter?: string } } StoreFilterConfig
 *
 * @typedef { Extract<import('@octokit/webhooks').EmitterWebhookEventName, 'issues' | `issues.${string}` | 'issue_comment' | `issue_comment.${string}` | 'pull_request' | `pull_request.${string}` | 'pull_request_review' | `pull_request_review.${string}` | 'pull_request_review_comment' | `pull_request_review_comment.${string}` | 'pull_request_review_thread' | `pull_request_review_thread.${string}`> } IssueOrPullWebhookEventName
 */

import { filterIssueOrPull } from '../../filters.js';
import { issueIdent } from '../../util/meta.js';

/**
 * An component that configures the store to filter certain elements,
 * effectively making them invisible to the board and its users.
 *
 * @param { StoreFilterConfig } config
 * @param { import('../../store.js').default } store
 * @param { import('../search/Search.js').default } search
 * @param { import('../../types.js').Logger } logger
 */
export default function IssueFilter(config, store, search, logger) {

  const log = logger.child({
    name: 'wuffle:issue-filter'
  });

  /**
   * @type { import('../search/Search.js').FilterFn }
   */
  let isIgnored = (issue) => false;


  if ('ignoreFilter' in config) {
    const ignoreFilterFn = search.buildFilterFn(config.ignoreFilter);

    if (ignoreFilterFn) {
      isIgnored = ignoreFilterFn;

      store.setIgnoreFilter(isIgnored);
    } else {
      log.warn('unparseable <ignoreFilter> - please correct your board configuration');
    }
  }

  /**
   * @param {import('../../types.js').Logger } log
   *
   * @return {<E extends IssueOrPullWebhookEventName>(fn: (context: import('probot').Context<E>) => any) => (context: import('probot').Context<E>) => any}
   */
  function createWebhookFilter(log) {

    return function ifEnabled(webhookHandlerFn) {

      return (context) => {

        const payload = /** @type {any} */ (context.payload);

        const issueOrPull = filterIssueOrPull(
          payload.issue || payload.pull_request,
          payload.repository
        );

        if (isIgnored(issueOrPull)) {
          log.debug({ issue: issueIdent(issueOrPull) }, 'issue matching ignore filter');

          return;
        }

        return webhookHandlerFn(context);
      };
    };
  };

  /**
   * Figure whether the issue shall be ignored (by ignore filter rules)
   *
   * @param {any} issue
   *
   * @return {boolean} true, if issue shall be ignored
   */
  this.isIgnored = isIgnored;

  /**
   * @param {import('../../types.js').Logger } log
   *
   * @return {<E extends IssueOrPullWebhookEventName>(fn: (context: import('probot').Context<E>) => any) => (context: import('probot').Context<E>) => any}
   */
  this.createWebhookFilter = createWebhookFilter;
}