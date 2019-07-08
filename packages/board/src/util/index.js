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
  isClosedByLink,
  isOpenOrMergedPull,
  isOpenPullOrMergedPull
} from './links';

export {
  debounce,
  throttle
} from 'min-dash';
