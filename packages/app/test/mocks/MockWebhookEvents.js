import Events from '../../lib/events.js';

/**
 * Fake events to register webhook listeners,
 * and to (locally) trigger webhook events.
 */
export default function FakeWebhookEvents() {

  const _events = new Events();

  /**
   * Register a event lister for a single
   * or a number of webhook events.
   *
   * @param {any|any[]} events
   * @param {Function} fn listener
   */
  function on(events, fn) {
    _events.on(events, fn);
  }

  /**
   * Register an event listener for all
   * webhook events.
   *
   * @param {Function} fn
   */
  function onAny(fn) {
    _events.on('::any', fn);
  }

  /**
   * @param { { name: string, payload?: Record<string, any> } } event
   */
  async function emit(event) {

    const { name, payload } = event;

    if (!name) {
      throw new Error('<event.name> required');
    }

    const action = payload?.action;

    const eventName = action ? `${name}.${action}` : name;

    await _events.emit(eventName, event);
    await _events.emit('::any', event);
  }

  // api /////////////////

  this.on = on;
  this.onAny = onAny;

  /**
   * @param { { name: string } } event
   *
   * @return Promise<any>
   */
  this.emit = emit;
}