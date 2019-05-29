const express = require('express');

const path = require('path');


/**
 * This component provides the publicly accessible board routes.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  // landing page

  app.router.get('/', (req, res, next) => {
    res.redirect('/board');
  });

  // static resources

  app.router.use('/board', express.static(path.join(__dirname, '..', '..', '..', 'board', 'public')));
};