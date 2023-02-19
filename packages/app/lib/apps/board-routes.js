const express = require('express');

const fs = require('fs');

const path = require('path');


/**
 * This component provides the publicly accessible board routes.
 *
 * @param {import('express').Router} router
 */
module.exports = async (config, router) => {

  const staticDirectory = path.join(__dirname, '..', '..', 'public');

  router.get('/', (req, res, next) => {
    res.redirect('/board');
  });

  // board page

  const {
    name,
    columns
  } = config;

  const boardConfig = {
    columns: columns.map(c => {
      const { name, collapsed } = c;

      return {
        name,
        collapsed: collapsed || false
      };
    }),
    name: name || 'Wuffle Board'
  };

  let indexPage;

  function getIndexPage() {
    if (indexPage) {
      return indexPage;
    }

    indexPage = fs.readFileSync(path.join(staticDirectory, 'index.html'), 'utf8');

    indexPage = indexPage.replace(
      '<title>Wuffle Board</title>',
      '<title>' + boardConfig.name + ' · Wuffle Board</title>'
    );

    indexPage = indexPage.replace(
      '<script type="application/json+config"></script>',
      '<script type="application/json+config">' +
        JSON.stringify(boardConfig)
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;') +
      '</script>'
    );
  }

  router.get('/board', (req, res, next) => {
    indexPage = getIndexPage();

    res.type('html').status(200).send(getIndexPage());
  });

  router.get('/robots.txt', (req, res, next) => {
    res.sendFile(path.join(staticDirectory, 'robots.txt'));
  });

  router.get('/service-worker.js', (req, res, next) => {
    res.sendFile(path.join(staticDirectory, 'service-worker.js'));
  });

  // static resources

  router.use('/board', express.static(staticDirectory));
};