/**
 * This component adds the #onActive method to subscribe to events
 * for explicitly activated repositories only.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  const repositoryMap = config.repositories.reduce((map, name) => {
    map[name] = true;

    return map;
  }, {});


  function onActive(events, fn) {

    app.on(events, function(context) {

      const {
        repository
      } = context.payload;

      if (!repositoryMap[repository.full_name]) {
        return;
      }

      return fn(context);
    });

  }


  // api ////////////////////

  app.onActive = onActive;

};