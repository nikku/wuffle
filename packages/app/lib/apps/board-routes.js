import express from 'express';

import fs from 'node:fs';

import { relativePath } from '../util/index.js';
import { fileURLToPath } from 'node:url';


/**
 * This component provides the publicly accessible board routes.
 *
 * @param {import('express').Router} router
 */
export default async function BoardRoutes(config, router) {

  const staticDirectory = relativePath('../../public/', import.meta.url);

  router.get('/', (req, res, next) => {
    res.redirect('/board');
  });

  // board page

  const {
    name,
    description,
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

    indexPage = fs.readFileSync(relativePath('index.html', staticDirectory), 'utf8');

    if (name) {
      indexPage = indexPage.replace(
        '<title>Wuffle Board</title>',
        '<title>' + boardConfig.name + ' · Wuffle Board</title>'
      );
    }

    if (description) {
      indexPage = indexPage.replace(
        '<meta name="description" content="Multi repository taskboard for GitHub issues, powered by Wuffle (https://wuffle.dev)." />',
        '<meta name="description" content="' + description + '" />'
      );
    }

    indexPage = indexPage.replace(
      '<script type="application/json+config"></script>',
      '<script type="application/json+config">' +
        JSON.stringify(boardConfig)
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;') +
      '</script>'
    );

    return indexPage;
  }

  router.get('/board', (req, res, next) => {
    res.type('html').status(200).send(getIndexPage());
  });

  const robotsPath = fileURLToPath(
    relativePath('robots.txt', staticDirectory)
  );

  router.get('/robots.txt', (req, res, next) => {
    res.sendFile(robotsPath);
  });

  const serviceWorkerPath = fileURLToPath(
    relativePath('service-worker.js', staticDirectory)
  );

  router.get('/service-worker.js', (req, res, next) => {
    res.sendFile(serviceWorkerPath);
  });

  // static resources

  const staticDirectoryPath = fileURLToPath(staticDirectory);

  router.use('/board', express.static(staticDirectoryPath));
}