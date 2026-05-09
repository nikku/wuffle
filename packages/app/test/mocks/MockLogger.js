export default function MockLogger() {

  function createLog(level) {
    return function(context, message) {

      if (typeof context === 'string') {
        message = context;
        context = {};
      }

      message = `[${level}] ${message}`;

      console.log(message, context);
    };
  }

  this.log = createLog('_');

  this.error = createLog('error');
  this.info = createLog('info');
  this.warn = createLog('warn');
  this.debug = createLog('debug');

  this.child = function() {
    return this;
  };
}