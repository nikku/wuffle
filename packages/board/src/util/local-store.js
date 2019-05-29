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

export class FakeLocalStore {

  get(name, defaultValue) {
    return defaultValue;
  }

  set(name, value) { }

}


export function createLocalStore() {

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return new FakeLocalStore();
  }

  return new LocalStore();
}