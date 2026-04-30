/**
 * @typedef { { ignoreFilter?: string } } StoreFilterConfig
 */

/**
 * An component that configures the store to filter certain elements,
 * effectively making them invisible to the board and its users.
 *
 * @param { StoreFilterConfig } config
 *
 * @param { import('../store.js').default } store
 * @param { import('./search/Search.js').default } search
 * @param { import('../types.js').Logger } logger
 */
export default function StoreFilter(config, store, search, logger) {

  const log = logger.child({
    name: 'wuffle:store-filter'
  });

  if ('ignoreFilter' in config) {
    const ignoreFilterFn = search.buildFilterFn(config.ignoreFilter);

    if (ignoreFilterFn) {
      store.setIgnoreFilter(ignoreFilterFn);
    } else {
      log.warn('unparseable <ignoreFilter> - please correct your board configuration');
    }
  }

}