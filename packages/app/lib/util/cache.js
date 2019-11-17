
class Cache {

  constructor(ttl) {
    this.ttl = ttl;

    this.entries = {};
  }

  remove(key) {
    delete this.entries[key];
  }

  evict() {

    const {
      entries,
      ttl
    } = this;

    if (ttl === -1) {
      return;
    }

    const now = Date.now();

    Object.keys(entries).forEach(key => {

      const entry = entries[key];

      if (now - entry.created > ttl) {
        this.remove(key);
      }
    });

  }

  async get(key, defaultValue) {

    const entry = this.entries[key];

    if (entry) {
      return entry.value;
    }

    const value =
      typeof defaultValue === 'function'
        ? await defaultValue(key)
        : defaultValue;

    this.set(key, value);

    return value;
  }

  set(key, value) {
    this.entries[key] = {
      created: Date.now(),
      value
    };
  }

}

module.exports.Cache = Cache;


class KeepAliveCache extends Cache {

  get(key, defaultValue) {

    const entry = this.entries[key];

    if (entry) {
      entry.created = Date.now();
    }

    return super.get(key, defaultValue);
  }
}

module.exports.KeepAliveCache = KeepAliveCache;


class NoopCache {

  evict() { }

  get(key, defaultValue) {

    const value =
      typeof defaultValue === 'function'
        ? defaultValue()
        : defaultValue;

    return value;
  }
}

module.exports.NoopCache = NoopCache;