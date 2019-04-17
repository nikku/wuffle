export class LocalStore {

  get(name, defaultValue) {

    try {
      const serializedValue = window.localStorage.getItem(name);

      if (serializedValue) {
        return JSON.parse(serializedValue);
      }
    } catch (error) {
      console.warn('LocalStore: Failed to retrieve %s', name, error);
    }

    return defaultValue;
  }

  set(name, value) {

    try {
      window.localStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      console.warn('LocalStore: Failed to set %s', name, error);
    }
  }

}

export class FakeStore {

  get(name, defaultValue) {
    return defaultValue;
  }

  set(name, value) { }

}


export function createLocalStore() {

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return new FakeStore();
  }

  return new LocalStore();
}


export class History {

  push(url) {
    window.history.pushState(null, null, url);
  }

  onPop(fn) {
    window.addEventListener('popstate', fn);

    return function() {
      window.removeEventListener('popstate', fn);
    };
  }

}

export class FakeHistory {

  push(url) {}

  onPop(fn) {
    return function() {};
  }

}


export function createHistory() {

  if (typeof window === 'undefined' || typeof window.history === 'undefined') {
    return new FakeHistory();
  }

  return new History();
}


export function delay(fn, timeout) {
  setTimeout(fn, timeout);
}

export function periodic(fn, interval) {

  const i = setInterval(fn, interval);

  return function() {
    clearInterval(i);
  };
}

export { debounce } from 'min-dash';