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
 */
export default function StoreFilter(config, store, search) {

  if ('ignoreFilter' in config) {
    const ignoreFilterFn = search.buildFilterFn(config.ignoreFilter);

    store.setIgnoreFilter(ignoreFilterFn);
  }

}