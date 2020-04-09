export { default as Id } from './Id';

export { default as autoresize } from './autoresize';

export {
  createLocalStore
} from './local-store';

export {
  createHistory
} from './history';

export function delay(fn, timeout) {
  setTimeout(fn, timeout);
}

export function periodic(fn, interval) {

  let canceled = false;

  let timeout = interval;

  let i;

  function stop() {
    canceled = true;

    clearTimeout(i);
  }

  function run() {

    Promise.resolve({}).then(() => fn()).then(
      success => true,
      err => false
    ).then(success => {
      timeout = success === false ? timeout * 1.5 : interval;

      if (!canceled) {
        i = setTimeout(run, timeout);
      }
    });
  }

  run();

  return stop;
}

export {
  isClosingLink,
  isClosedByLink
} from './links';

export function isOpen(issue) {
  return issue.state === 'open';
}

export function isMerged(issue) {
  return issue.merged;
}

export function isOpenOrMerged(issue) {
  return isOpen(issue) || isMerged(issue);
}

export function isPull(issue) {
  return issue.pull_request;
}

export {
  debounce,
  throttle
} from 'min-dash';


export function noDuplicates(keyFn) {

  const found = {};

  return function filter(element) {
    const key = keyFn(element);

    if (key in found) {
      return false;
    }

    found[key] = true;

    return true;
  };
}