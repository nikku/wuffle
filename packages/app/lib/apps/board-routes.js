const express = require('express');

const path = require('path');


/**
 * This component provides the publicly accessible board routes.
 *
 * @param {import("express").Router} router
 */
module.exports = async (router) => {

  const staticDirectory = path.join(__dirname, '..', '..', 'public');

  router.get('/', (req, res, next) => {
    res.redirect('/board');
  });

  // board page

  router.get('/board', (req, res, next) => {
    res.sendFile(path.join(staticDirectory, 'index.html'));
  });

  router.get('/service-worker.js', (req, res, next) => {
    res.sendFile(path.join(staticDirectory, 'service-worker.js'));
  });

  // static resources

  router.use('/board', express.static(staticDirectory));
};