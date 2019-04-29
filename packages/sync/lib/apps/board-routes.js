const bodyParser = require('body-parser').text();

const {
  cors,
  withSession,
  safeAsync
} = require('../middleware');

const {
  repoAndOwner
} = require('../util');


/**
 * This component provides the board routes.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  const middlewares = [
    withSession,
    cors
  ];

  // endpoints ///////////////////

  function getIssueSearchFilter(req) {
    const search = req.query.s;

    if (!search) {
      return null;
    }

    return app.getSearchFilter(search);
  }

  function getIssueReadFilter(req) {
    const token = app.getGitHubToken(req);

    return app.getReadFilter(token);
  }

  function filterBoardItems(req, items) {

    const searchFilter = getIssueSearchFilter(req);

    return getIssueReadFilter(req).then(canAccess => {

      return Object.entries(items).reduce((filteredItems, [ columnKey, columnIssues ]) => {

        const accessFiltered = columnIssues.filter(canAccess);

        const searchFiltered = searchFilter ? accessFiltered.filter(searchFilter) : accessFiltered;

        filteredItems[columnKey] = searchFiltered;

        return filteredItems;
      }, {});

    });

  }

  function filterUpdates(req, updates) {

    const searchFilter = getIssueSearchFilter(req);

    return getIssueReadFilter(req).then(canAccess => {

      const accessFiltered = updates.filter(update => canAccess(update.issue));

      const searchFiltered = searchFilter ? accessFiltered.map(update => {

        if (searchFilter(update.issue)) {
          return update;
        }

        // remove from current view, as updated issue does not apply
        // to search filter anymore
        return {
          ...update,
          type: 'remove'
        };
      }) : accessFiltered;

      return searchFiltered;
    });

  }


  // public endpoints ////////

  app.router.get('/wuffle/cards', ...middlewares, safeAsync((req, res) => {

    const items = store.getBoard();
    const cursor = store.getUpdateHead().id;

    return filterBoardItems(req, items).then(filteredItems => {

      res.json({
        items: filteredItems,
        cursor
      });
    });
  }));


  app.router.get('/wuffle/board', ...middlewares, safeAsync((req, res) => {

    const {
      columns,
      repositories
    } = config;

    return res.json({
      columns: columns.map(c => {
        const { name } = c;

        return { name };
      }),
      name: repositories[0] || 'empty'
    });

  }));


  app.router.get('/wuffle/updates', ...middlewares, safeAsync((req, res) => {
    const cursor = req.query.cursor;

    const updates = cursor ? store.getUpdates(cursor) : [];

    return filterUpdates(req, updates).then(filteredUpdates => res.json(filteredUpdates));
  }));


  app.router.post('/wuffle/issues/move', ...middlewares, bodyParser, safeAsync(async (req, res) => {

    const login = app.getGitHubLogin(req);

    if (!login) {
      return res.status(401).json({});
    }

    const body = JSON.parse(req.body);

    const {
      before,
      after,
      column,
      id,
    } = body;

    const issue = store.getIssue({ id });

    const repo = repoAndOwner(issue);

    const canWrite = await app.canWrite(login, repo);

    if (!canWrite) {
      return res.status(403).json({});
    }

    store.updateOrder(issue.id, before, after, column);

    const token = app.getGitHubToken(req);

    const github = await app.userAuth(token);

    const context = {
      github,
      repo(opts) {
        return {
          ...repo,
          ...opts
        };
      }
    };

    // we move the issue via GitHub and rely on the automatic-dev-flow
    // to pick up the update (and react to it)

    await Promise.all([
      app.moveIssue(context, issue, column),
      app.moveReferencedIssues(context, issue, column)
    ]);

    res.json({});
  }));

};