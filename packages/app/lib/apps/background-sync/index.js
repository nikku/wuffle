import BackgroundSync from './BackgroundSync.js';
import BackgroundSyncBackend from './BackgroundSyncBackend.js';

export default {
  __init__: [ 'backgroundSync' ],
  backgroundSync: [ 'type', BackgroundSync ],
  backgroundSyncBackend: [ 'type', BackgroundSyncBackend ]
};