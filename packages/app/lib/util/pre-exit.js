const exitHook = require('exit-hook2');

module.exports = function preExit(fn) {

  let registered, done;

  exitHook(function(canCancel, signal, code) {

    if (!canCancel) {
      return;
    }

    if (!registered) {

      registered = Promise.resolve(fn()).finally(() => {
        done = true;

        process.exit(code);
      });
    }

    return done === true;
  });
};