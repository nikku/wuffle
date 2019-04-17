export class LocalStore {

  get(name, defaultValue) {

    try {
      const serializedValue = localStorage.getItem(name);

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
      localStorage.setItem(name, JSON.stringify(value));
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


export function create() {

  if (typeof localStorage === 'undefined') {
    return new FakeStore();
  }

  return new LocalStore();
}