/**
 * A cache that allows tree-like keys
 */
export default class TreeCache {

  constructor(ttl = -1) {
    this._cache = {};
    this._accessed = {};

    this._ttl = ttl;
  }

  async get(key, defaultValue) {

    this._access(key);

    if (key in this._cache) {
      return this._cache[key];
    }

    if (typeof defaultValue === 'function') {
      defaultValue = await defaultValue(key);
    }

    this.set(key, defaultValue);

    return defaultValue;
  }

  set(key, value) {
    this._cache[key] = value;
  }

  _access(key) {
    this._accessed[key] = Date.now();
  }

  invalidate(key) {

    const matches = this.match(key);

    for (const match of matches) {
      this.remove(match.key);
    }
  }

  match(key) {

    let test;

    if (key.includes('*')) {
      const pattern = new RegExp('^' + key.split('*').map(regexEscape).join('([^:]+)') + '$');

      test = (str) => pattern.exec(str);
    } else {
      test = (str) => str === key;
    }

    const matches = [];

    for (const cacheKey of Object.keys(this._cache)) {

      const match = test(cacheKey);

      if (!match) {
        continue;
      }

      if (match === true) {
        matches.push({
          key: cacheKey,
          value: this._cache[cacheKey],
          match: []
        });
      } else {

        const [ _, ...matchedPatterns ] = match;

        matches.push({
          key: cacheKey,
          value: this._cache[cacheKey],
          match: matchedPatterns
        });
      }
    }

    return matches;
  }

  remove(key) {
    delete this._cache[key];
    delete this._accessed[key];
  }

  evict(now = Date.now()) {

    const evictBefore = now - this._ttl;

    for (const [ key, accessed ] of Object.entries(this._accessed)) {

      if (accessed < evictBefore) {
        this.remove(key);
      }
    }

  }

}


// helpers ///////////////

function regexEscape(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}