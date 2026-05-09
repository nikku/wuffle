/**
 * @typedef { import('../../lib/apps/search/Search.js').FilterFn } FilterFn
 */

/**
 * Fake IssueFilter that provides a configurable webhook filter.
 */
export default function FakeIssueFilter() {

  /**
   * @type { FilterFn }
   */
  let isIgnored = (issueOrPull) => false;

  /**
   * @param {import('../../lib/types.js').Logger} log
   *
   * @return { (handlerFn) => (context) => any }
   */
  this.createWebhookFilter = function(log) {
    return function ifEnabled(fn) {
      return (context) => {
        const issueOrPull = context.payload.issue || context.payload.pull_request;

        if (isIgnored(issueOrPull)) {
          return;
        }

        return fn(context);
      };
    };
  };

  /**
   * Configure the ignore predicate.
   *
   * @param { FilterFn } fn
   */
  this.setIgnored = (fn) => {
    isIgnored = fn;
  };

  this.isIgnored = (issue) => isIgnored(issue);
}
