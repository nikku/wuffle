const Events = require('../lib/events');

const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const chai = require('chai');

chai.use(sinonChai);

const {
  expect,
  fail
} = require('chai');

describe('Events', function() {

  var events;

  beforeEach(function() {
    events = new Events();
  });


  describe('basic behavior', function() {

    it('should.emit listener', async function() {

      // given
      var listener = sinon.spy(async () => {});

      events.on('foo', listener);

      // when
      await events.emit('foo', {});

      // then
      expect(listener).to.have.been.called;
    });


    it('should.emit typed listener', async function() {

      // given
      var listener = sinon.spy(async () => {});

      events.on('foo', listener);

      // when
      await events.emit({ type: 'foo' });

      // then
      expect(listener).to.have.been.called;
    });


    it('should register multiple', async function() {

      // given
      var listener = sinon.spy(async () => {});

      events.on([ 'foo', 'foo' ], listener);

      // when
      await events.emit({ type: 'foo' });

      // then
      expect(listener).to.have.been.calledTwice;
    });


    it('should stopPropagation', async function() {

      // given
      var listener1 = sinon.spy(async (event) => {
        event.stopPropagation();
      });

      var listener2 = sinon.spy();

      events.on('foo', listener1);
      events.on('foo', listener2);

      // when
      await events.emit({ type: 'foo' });

      // then
      expect(listener1).to.have.been.called;
      expect(listener2).not.to.have.been.called;
    });


    it('should.emit event by name', async function() {

      // given
      var listener = sinon.spy();

      // when
      events.on('foo', listener);
      await events.emit('foo');

      expect(listener).to.have.been.called;
    });

  });


  describe('handle multiple events', function() {

    it('should register to multiple events', async function() {

      // given
      var listener1 = sinon.spy();

      events.on([ 'foo', 'bar' ], listener1);

      // when
      await events.emit({ type: 'foo' });

      // then
      expect(listener1).to.have.been.called;
    });


    it('should remove multiple listeners', async function() {

      // given
      var listener1 = sinon.spy();

      events.on([ 'foo', 'bar' ], listener1);
      events.off([ 'foo', 'bar' ], listener1);

      // when
      await events.emit({ type: 'foo' });
      await events.emit({ type: 'bar' });

      // then
      expect(listener1).not.to.have.been.called;
    });

  });


  describe('handle once listener', function() {

    it('should call listeners after once listener', async function() {

      // given
      var listenerBefore = sinon.spy();
      var listenerOnce = sinon.spy();
      var listenerAfter = sinon.spy();

      events.on('foo', listenerBefore);
      events.once('foo', listenerOnce);
      events.on('foo', listenerAfter);

      // when
      await events.emit('foo');

      // then
      expect(listenerBefore).to.have.been.calledOnce;
      expect(listenerOnce).to.have.been.calledOnce;
      expect(listenerAfter).to.have.been.calledOnce;

      // but when...
      await events.emit('foo');

      // then
      // still only called once
      expect(listenerOnce).to.have.been.calledOnce;

      // should be called again
      expect(listenerBefore).to.have.been.calledTwice;
      expect(listenerAfter).to.have.been.calledTwice;
    });


    it('should call once listener only once', async function() {

      // given
      var listener = sinon.spy();

      // when
      events.once('onceEvent', listener);
      await events.emit('onceEvent', { value: 'a' });

      // then
      expect(listener).to.have.been.calledOnce;

      // but when...
      await events.emit('onceEvent');

      // then
      // still only called once
      expect(listener).to.have.been.calledOnce;

      // but when...
      // emitting with re-registered listener
      events.once('onceEvent', listener);
      await events.emit('onceEvent');

      // then
      // should be.emitd again
      expect(listener).to.have.been.calledTwice;
    });

  });


  describe('return value', function() {

    it('should be undefined if no listeners', async function() {

      // when
      var returnValue = await events.emit('foo');

      // then
      expect(returnValue).not.to.exist;
    });


    it('should be undefined on event if no listeners', async function() {

      // given
      var event = events.createEvent();

      event.init({ type: 'foo' });

      // when
      await events.emit(event);

      // then
      expect(event).not.to.have.property('returnValue');
    });


    it('should be true with non-acting listener', async function() {

      // given
      events.on('foo', function(event) { });

      // when
      var returnValue = await events.emit('foo');

      // then
      expect(returnValue).not.to.exist;
    });


    it('should be false with listener preventing event default', async function() {

      // given
      events.on('foo', function(event) {
        event.preventDefault();
      });

      // when
      var returnValue = await events.emit('foo');

      // then
      expect(returnValue).to.be.false;
    });


    it('should be undefined with listener stopping propagation', async function() {

      // given
      events.on('foo', function(event) {
        event.stopPropagation();
      });

      // when
      var returnValue = await events.emit('foo');

      // then
      expect(returnValue).not.to.exist;
    });

  });


  describe('passing context', function() {
    function Dog() {}

    Dog.prototype.bark = function(msg) {
      return msg || 'WOOF WOOF';
    };

    it('should pass context to listener', async function() {

      // given
      Dog.prototype.bindListener = function() {

        events.on('bark', (event) => {
          return this.bark();
        });
      };

      var bobby = new Dog();

      bobby.bindListener();

      // when
      var returnValue = await events.emit('bark');

      // then
      expect(returnValue).to.equal('WOOF WOOF');
    });


    it('should pass context to listener and provide priority', async function() {

      // given
      Dog.prototype.bindListener = function(priority, msg) {
        events.on('bark', (event) => {
          return this.bark(msg);
        }, priority);
      };

      var bobby = new Dog();
      var bull = new Dog();

      bobby.bindListener(1000);
      bull.bindListener(1500, 'BOO');

      // when
      var returnValue = await events.emit('bark');

      // then
      expect(returnValue).to.equal('BOO');
    });


    it('should pass context to listener and provide priority -> once', async function() {

      // given
      Dog.prototype.bindListener = function(priority, msg) {
        events.once('bark', (event) => {
          return this.bark(msg);
        }, priority);
      };

      var bobby = new Dog();
      var bull = new Dog();

      bobby.bindListener(500, 'FOO');
      bull.bindListener(1500, 'BOO');

      // when
      var returnA = await events.emit('bark');
      var returnB = await events.emit('bark');
      var returnC = await events.emit('bark');

      // then
      expect(returnA).to.equal('BOO');
      expect(returnB).to.equal('FOO');
      expect(returnC).not.to.exist;
    });


    it('should.emit only once', async function() {

      // given
      Dog.prototype.barks = [];

      Dog.prototype.bindListener = function() {
        events.once('bark', (event) => {
          this.barks.push('WOOF WOOF');
        });
      };

      var bobby = new Dog();

      bobby.bindListener();

      // when
      await events.emit('bark'),
      await events.emit('bark');

      // then
      expect(bobby.barks).to.have.length(1);
    });

  });


  describe('returning custom value in listener', function() {

    it('should pass through', async function() {

      // given
      var result = {};

      events.on('foo', function(event) {
        return result;
      });

      // when
      var returnValue = await events.emit('foo');

      // then
      expect(returnValue).to.equal(result);
    });


    it('should stop propagation', async function() {

      // given
      var result = {},
          otherResult = {};

      events.on('foo', function(event) {
        return result;
      });

      events.on('foo', function(event) {
        return otherResult;
      });

      // when
      var returnValue = await events.emit('foo');

      // then
      expect(returnValue).to.equal(result);
    });

  });


  describe('returning false in listener', function() {

    it('should set return value to false', async function() {

      // given
      events.on('foo', function(event) {
        return false;
      });

      // when
      var returnValue = await events.emit('foo');

      // then
      expect(returnValue).to.be.false;
    });


    it('should stop propagation to other listeners', async function() {

      // given
      var listener1 = sinon.spy(function(event) {
        return false;
      });

      var listener2 = sinon.spy();

      events.on('foo', listener1);
      events.on('foo', listener2);

      // when
      var returnValue = await events.emit('foo');

      // then
      expect(returnValue).to.be.false;

      expect(listener1).to.have.been.called;
      expect(listener2).not.to.have.been.called;
    });

  });


  describe('custom arguments', function() {

    it('should pass arguments', async function() {

      var listenerArgs;

      function captureArgs() {
        listenerArgs = arguments;
      }

      events.on('capture', captureArgs);

      // when
      await events.emit('capture', 1, 2, 3);

      // then
      expect(listenerArgs.length).to.eql(4);
      expect(listenerArgs[1]).to.eql(1);
      expect(listenerArgs[2]).to.eql(2);
      expect(listenerArgs[3]).to.eql(3);
    });

  });


  describe('removing listeners', function() {

    it('should remove listeners by event type', async function() {

      // given
      var listener1 = sinon.spy();
      var listener2 = sinon.spy();

      events.on('foo', listener1);
      events.on('foo', listener2);

      // when
      events.off('foo');
      await events.emit({ type: 'foo' });

      // then
      expect(listener1).not.to.have.been.called;
      expect(listener2).not.to.have.been.called;
    });


    it('should remove listener by callback', async function() {

      // given
      var listener1 = sinon.spy();
      var listener2 = sinon.spy();

      events.on('foo', listener1);
      events.on('foo', listener2);

      // when
      events.off('foo', listener1);
      await events.emit({ type: 'foo' });

      // then
      expect(listener1).not.to.have.been.called;
      expect(listener2).to.have.been.called;
    });


    it('should remove once listener by callback', async function() {

      // given
      var listener1 = sinon.spy();
      var listener2 = sinon.spy();

      events.once('foo', listener1);
      events.on('foo', listener2);

      // when
      events.off('foo', listener1);
      await events.emit({ type: 'foo' });

      // then
      expect(listener1).not.to.have.been.called;
      expect(listener2).to.have.been.called;
    });


    it('should remove bound listener by callback', async function() {

      // given
      var listener1 = sinon.spy();
      var listener2 = sinon.spy();

      events.on('foo', listener1);
      events.on('foo', listener2);

      // when
      events.off('foo', listener1);
      await events.emit({ type: 'foo' });

      // then
      expect(listener1).not.to.have.been.called;
      expect(listener2).to.have.been.called;
    });


    it('should remove bound once listener by callback', async function() {

      // given
      var listener1 = sinon.spy();
      var listener2 = sinon.spy();

      events.once('foo', listener1);
      events.on('foo', listener2);

      // when
      events.off('foo', listener1);
      await events.emit({ type: 'foo' });

      // then
      expect(listener1).not.to.have.been.called;
      expect(listener2).to.have.been.called;
    });


    it('should not call listener removed in previous listener\'s callback', async function() {

      // given
      var eventName = 'foo';

      var listener1,
          listener2 = sinon.spy();

      listener1 = sinon.spy(function() {
        events.off(eventName, listener2);
        events.off(eventName, listener1);
      });

      events.on(eventName, listener1);
      events.on(eventName, listener2);

      // when
      await events.emit({ type: eventName });

      // then
      expect(listener1).to.be.calledOnce;
      expect(listener2).to.have.not.been.called;

      // when
      listener1.resetHistory();
      listener2.resetHistory();

      await events.emit({ type: eventName });

      // then
      expect(listener1).to.have.not.been.called;
      expect(listener2).to.have.not.been.called;
    });

  });


  describe('adding listener during <emit>', function() {

    it('should call lower priority listener', async function() {

      // given
      var listenerAdded = sinon.spy();

      var listenerOnce = sinon.spy(function() {
        events.once('foo', listenerAdded, 500);
      });

      events.once('foo', listenerOnce);

      // when
      await events.emit('foo');

      // then
      expect(listenerOnce).to.have.been.calledOnce;
      expect(listenerAdded).to.have.been.calledOnce;

      // but when...
      await events.emit('foo');

      // then
      // still only called once
      expect(listenerOnce).to.have.been.calledOnce;
      expect(listenerAdded).to.have.been.calledOnce;
    });


    it('should NOT call higher priority listener', async function() {

      // given
      var listenerAdded = sinon.spy();

      var listenerOnce = sinon.spy(function() {
        events.once('foo', listenerAdded, 5000);
      });

      events.once('foo', listenerOnce);

      // when
      await events.emit('foo');

      // then
      expect(listenerOnce).to.have.been.calledOnce;
      expect(listenerAdded).not.to.have.been.called;

      // but when...
      await events.emit('foo');

      // then
      // still only called once
      expect(listenerOnce).to.have.been.calledOnce;

      // called once now, too
      expect(listenerAdded).to.have.been.calledOnce;
    });


    it('should call same priority listener', async function() {

      // given
      var listenerAdded = sinon.spy();

      var listenerOnce = sinon.spy(function() {
        events.once('foo', listenerAdded);
      });

      events.once('foo', listenerOnce);

      // when
      await events.emit('foo');

      // then
      expect(listenerOnce).to.have.been.calledOnce;
      expect(listenerAdded).to.have.been.calledOnce;
    });

  });


  describe('error handling', function() {

    it('should propagate error via <error> event', async function() {

      // given
      var errorListener = sinon.spy();
      var failingListener = function() {
        throw new Error('expected failure');
      };

      // when
      events.on('error', errorListener);
      events.on('fail', failingListener);

      // then
      try {
        await events.emit({ type: 'fail' });

        fail('unexpected success');
      } catch (error) {
        expect(error.message).to.eql('expected failure');
      }

      expect(errorListener).to.have.been.called;
    });


    it('should handle error in <error> event listener', async function() {

      // given
      function errorListener(e) {
        e.preventDefault();
      }

      function failingListener() {
        throw new Error('expected failure');
      }

      // when
      events.on('error', errorListener);
      events.on('fail', failingListener);

      // then
      await events.emit({ type: 'fail' });
    });


    it('should throw error without <error> event listener', async function() {

      // given
      function failingListener() {
        throw new Error('expected failure');
      }

      // when
      events.on('fail', failingListener);

      // then
      try {
        await events.emit({ type: 'fail' });

        fail('unexpected success');
      } catch (error) {
        expect(error.message).to.eql('expected failure');
      }
    });

  });


  describe('event priorities', function() {

    var listener1,
        listener2,
        listener3,
        listenerStopPropagation;


    beforeEach(function() {

      listener1 = function(e) {
        if (e.data.value === 'C') {
          e.data.value = 'Target State';
        } else {
          e.data.value = '';
        }
      };

      listener2 = function(e) {
        if (e.data.value === 'A') {
          e.data.value = 'B';
        } else {
          e.data.value = '';
        }
      };

      listener3 = function(e) {
        if (e.data.value === 'B') {
          e.data.value = 'C';
        } else {
          e.data.value = '';
        }
      };

      listenerStopPropagation = function(e) {
        if (e.data.value === 'B') {
          e.data.value = 'C';
          e.stopPropagation();
        } else {
          e.data.value = '';
        }
      };

    });


    it('should.emit highes priority first', async function() {

      // setup
      events.on('foo', listener1, 100);
      events.on('foo', listener2, 500);
      events.on('foo', listener3, 200);

      // event.emitd with example data
      // to control the order of execution
      var param = { data: { value: 'A' } };
      await events.emit('foo', param);

      expect(param.data.value).to.equal('Target State');
    });


    it('should.emit highest first (independent from registration order)', async function() {

      // setup
      events.on('foo', listener3, 200);
      events.on('foo', listener1, 100);
      events.on('foo', listener2, 500);

      // event.emitd with example data
      // to control the order of execution
      var param = { data: { value: 'A' } };
      await events.emit('foo', param);

      expect(param.data.value).to.equal('Target State');
    });


    it('should.emit same priority in registration order', async function() {

      // setup
      events.on('foo', listener3, 100);
      events.on('foo', listener2, 100);
      events.on('foo', listener1, 100);

      // event.emitd with example data
      // to control the order of execution
      var param = { data: { value: 'A' } };
      await events.emit('foo', param);
    });


    it('should stop propagation to lower priority handlers', async function() {

      // setup
      events.on('foo', listenerStopPropagation, 200);
      events.on('foo', listener1, 100);
      events.on('foo', listener2, 500);

      // event.emitd with example data
      // to control the order of execution
      var param = { data: { value: 'A' } };
      await events.emit('foo', param);

      // After second listener propagation should be stopped
      // listener1 should not be.emitd.
      expect(param.data.value).to.equal('C');
    });


    it('should default to 1000 if non is specified', async function() {

      // setup
      events.on('foo', listener3); // should use default of 1000
      events.on('foo', listener1, 500);
      events.on('foo', listener2, 5000);

      // event.emitd with example data
      // to control the order of execution
      var param = { data: { value: 'A' } };
      await events.emit('foo', param);

      // After second listener propagation should be stopped
      // listener1 should not be.emitd.
      expect(param.data.value).to.equal('Target State');
    });

  });

});