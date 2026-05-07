/**
 * @typedef { { ignoreFilter?: string } } StoreFilterConfig
 */

/**
 * An component that configures the store to filter certain elements,
 * effectively making them invisible to the board and its users.
 *
 * @param { StoreFilterConfig } config
 *
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
   * Figure whether the issue shall be ignored (by ignore filter rules)
   *
   * @param {any} issue
   *
   * @return {boolean} true, if issue shall be ignored
   */
  this.isIgnored = isIgnored;

}