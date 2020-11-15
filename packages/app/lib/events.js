const {
  isArray,
  isNumber,
  assign,
  isUndefined
} = require('min-dash');

var FN_REF = '__fn';

var DEFAULT_PRIORITY = 1000;

var slice = Array.prototype.slice;

function Events() {
  this._listeners = {};
}

module.exports = Events;


/**
 * Register an event listener for events with the given name.
 *
 * The callback will be invoked with `event, ...additionalArguments`
 * that have been passed to {@link Events#emit}.
 *
 * Returning false from a listener will prevent the events default action
 * (if any is specified). To stop an event from being processed further in
 * other listeners execute {@link Event#stopPropagation}.
 *
 * Returning anything but `undefined` from a listener will stop the listener propagation.
 *
 * @param {string|Array<string>} events
 * @param {Function} callback
 * @param {number} [priority=1000] the priority in which this listener is called, larger is higher
 */
Events.prototype.on = function(events, callback, priority) {

  events = isArray(events) ? events : [ events ];

  if (isUndefined(priority)) {
    priority = DEFAULT_PRIORITY;
  }

  if (!isNumber(priority)) {
    throw new Error('priority must be a number');
  }

  var actualCallback = callback;

  events.forEach((e) => {
    this._addListener(e, {
      priority: priority,
      callback: actualCallback,
      next: null
    });
  });
};


/**
 * Register an event listener that is executed only once.
 *
 * @param {string} event the event name to register for
 * @param {Function} callback the callback to execute
 * @param {number} [priority=1000] the priority in which this listener is called, larger is higher
 */
Events.prototype.once = function(event, callback, priority) {

  const wrappedCallback = () => {
    var result = callback.apply(null, arguments);

    this.off(event, wrappedCallback);

    return result;
  };

  // make sure we remember and are able to remove
  // bound callbacks via {@link #off} using the original
  // callback
  wrappedCallback[FN_REF] = callback;

  this.on(event, wrappedCallback, priority);
};


/**
 * Removes event listeners by event and callback.
 *
 * If no callback is given, all listeners for a given event name are being removed.
 *
 * @param {string|Array<string>} events
 * @param {Function} [callback]
 */
Events.prototype.off = function(events, callback) {

  events = isArray(events) ? events : [ events ];

  events.forEach((event) => {
    this._removeListener(event, callback);
  });

};


/**
 * Create an Events event.
 *
 * @param {Object} data
 *
 * @return {Object} event, recognized by the eventBus
 */
Events.prototype.createEvent = function(data) {
  var event = new InternalEvent();

  event.init(data);

  return event;
};


/**
 * Fires a named event.
 *
 * @example
 *
 * // emit event by name
 * events.emit('foo');
 *
 * // emit event object with nested type
 * var event = { type: 'foo' };
 * events.emit(event);
 *
 * // emit event with explicit type
 * var event = { x: 10, y: 20 };
 * events.emit('element.moved', event);
 *
 * // pass additional arguments to the event
 * events.on('foo', function(event, bar) {
 *   alert(bar);
 * });
 *
 * events.emit({ type: 'foo' }, 'I am bar!');
 *
 * @param {string|{ type: string }} [type] the optional event name
 * @param {Object} [data] the event object
 * @param {...Object} additionalArgs to be passed to the callback functions
 *
 * @return {Promise<boolean>} the events return value, if specified or false if the
 *                            default action was prevented by listeners
 */
Events.prototype.emit = async function(type, data, ...additionalArgs) {

  var event,
      firstListener,
      returnValue,
      args;

  args = slice.call(arguments);

  if (typeof type === 'object') {
    event = type;
    type = event.type;
  }

  if (!type) {
    throw new Error('no event type specified');
  }

  firstListener = this._listeners[type];

  if (!firstListener) {
    return;
  }

  // we make sure we emit instances of our home made
  // events here. We wrap them only once, though
  if (data instanceof InternalEvent) {

    // we are fine, we alread have an event
    event = data;
  } else {
    event = this.createEvent(data);
  }

  // ensure we pass the event as the first parameter
  args[0] = event;

  // original event type (in case we delegate)
  var originalType = event.type;

  // update event type before delegation
  if (type !== originalType) {
    event.type = type;
  }

  try {
    returnValue = await this._invokeListeners(event, args, firstListener);
  } finally {

    // reset event type after delegation
    if (type !== originalType) {
      event.type = originalType;
    }
  }

  // set the return value to false if the event default
  // got prevented and no other return value exists
  if (returnValue === undefined && event.defaultPrevented) {
    returnValue = false;
  }

  return returnValue;
};


Events.prototype.handleError = async function(error) {
  const returnValue = await this.emit('error', { error: error });

  return returnValue === false;
};


Events.prototype._destroy = function() {
  this._listeners = {};
};

Events.prototype._invokeListeners = async function(event, args, listener) {

  var returnValue;

  while (listener) {

    // handle stopped propagation
    if (event.cancelBubble) {
      break;
    }

    returnValue = await this._invokeListener(event, args, listener);

    listener = listener.next;
  }

  return returnValue;
};

Events.prototype._invokeListener = async function(event, args, listener) {

  var returnValue;

  try {

    // returning false prevents the default action
    returnValue = await invokeFunction(listener.callback, args);

    // stop propagation on return value
    if (returnValue !== undefined) {
      event.returnValue = returnValue;
      event.stopPropagation();
    }

    // prevent default on return false
    if (returnValue === false) {
      event.preventDefault();
    }
  } catch (error) {

    const handled = await this.handleError(error);

    if (!handled) {
      console.error('unhandled error in event listener');
      console.error(error.stack);

      throw error;
    }
  }

  return returnValue;
};

/*
 * Add new listener with a certain priority to the list
 * of listeners (for the given event).
 *
 * The semantics of listener registration / listener execution are
 * first register, first serve: New listeners will always be inserted
 * after existing listeners with the same priority.
 *
 * Example: Inserting two listeners with priority 1000 and 1300
 *
 *    * before: [ 1500, 1500, 1000, 1000 ]
 *    * after: [ 1500, 1500, (new=1300), 1000, 1000, (new=1000) ]
 *
 * @param {string} event
 * @param {Object} listener { priority, callback }
 */
Events.prototype._addListener = function(event, newListener) {

  var listener = this._getListeners(event),
      previousListener;

  // no prior listeners
  if (!listener) {
    this._setListeners(event, newListener);

    return;
  }

  // ensure we order listeners by priority from
  // 0 (high) to n > 0 (low)
  while (listener) {

    if (listener.priority < newListener.priority) {

      newListener.next = listener;

      if (previousListener) {
        previousListener.next = newListener;
      } else {
        this._setListeners(event, newListener);
      }

      return;
    }

    previousListener = listener;
    listener = listener.next;
  }

  // add new listener to back
  previousListener.next = newListener;
};


Events.prototype._getListeners = function(name) {
  return this._listeners[name];
};

Events.prototype._setListeners = function(name, listener) {
  this._listeners[name] = listener;
};

Events.prototype._removeListener = function(event, callback) {

  var listener = this._getListeners(event),
      nextListener,
      previousListener,
      listenerCallback;

  if (!callback) {

    // clear listeners
    this._setListeners(event, null);

    return;
  }

  while (listener) {

    nextListener = listener.next;

    listenerCallback = listener.callback;

    if (listenerCallback === callback || listenerCallback[FN_REF] === callback) {
      if (previousListener) {
        previousListener.next = nextListener;
      } else {

        // new first listener
        this._setListeners(event, nextListener);
      }
    }

    previousListener = listener;
    listener = nextListener;
  }
};

/**
 * A event that is emitted via the event bus.
 */
function InternalEvent() { }

InternalEvent.prototype.stopPropagation = function() {
  this.cancelBubble = true;
};

InternalEvent.prototype.preventDefault = function() {
  this.defaultPrevented = true;
};

InternalEvent.prototype.init = function(data) {
  assign(this, data || {});
};


/**
 * Invoke function. Be fast...
 *
 * @param {Function} fn
 * @param {Array<Object>} args
 *
 * @return {any}
 */
function invokeFunction(fn, args) {
  return fn(...args);
}