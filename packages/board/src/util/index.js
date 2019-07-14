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

  const i = setInterval(fn, interval);

  return function() {
    clearInterval(i);
  };
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


export function hasModifier(event) {
  return event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
}

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