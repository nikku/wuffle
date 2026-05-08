export default function FakeLogger() {

  this.log = function() {};
  this.error = function() {};
  this.info = function() {};
  this.warn = function() {};
  this.debug = function() {};

  this.child = function() {
    return this;
  };
}