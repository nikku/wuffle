const DumpStore = require('./DumpStoreS3');

module.exports = {
  __init__: [ 'dumpStore' ],
  dumpStore: [ 'type', DumpStore ]
};