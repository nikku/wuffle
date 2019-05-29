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