const express = require('express');

const compression = require('compression');

const path = require('path');


/**
 * This component provides the publicly accessible board routes.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  const staticDirectory = path.join(__dirname, '..', '..', '..', 'board', 'public');

  // landing page

  app.router.use(compression());

  app.router.get('/', (req, res, next) => {
    res.redirect('/board');
  });

  // board page

  app.router.get('/board', (req, res, next) => {
    res.sendFile(path.join(staticDirectory, 'index.html'));
  });

  // static resources

  app.router.use('/board', express.static(staticDirectory));
};