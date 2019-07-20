const bodyParser = require('body-parser').text();

const {
  withSession
} = require('../middleware');

const {
  repoAndOwner
} = require('../util');


/**
 * This component provides the board API routes.
 *
 * @param {Application} app
 * @param {Object} config
 * @param {Store} store
 */
module.exports = async (app, config, store) => {

  const log = app.log.child({
    name: 'wuffle:board-api-routes'
  });

  const middlewares = [
    withSession
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

        const accessFiltered = columnIssues.filter(canAccess).map(issue => {

          const {
            links
          } = issue;

          return {
            ...issue,
            links: links.filter(l => canAccess(l.target))
          };
        });

        const searchFiltered = searchFilter ? accessFiltered.filter(searchFilter) : accessFiltered;

        filteredItems[columnKey] = searchFiltered;

        return filteredItems;
      }, {});

    });

  }

  function filterUpdates(req, updates) {

    const searchFilter = getIssueSearchFilter(req);

    return getIssueReadFilter(req).then(canAccess => {

      const accessFiltered = updates.filter(update => canAccess(update.issue)).map(update => {
        const {
          issue
        } = update;

        const {
          links
        } = issue;

        return {
          ...update,
          issue: {
            ...issue,
            links: links.filter(l => canAccess(l.target))
          }
        };
      });

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

  function moveIssue(context, issue, params) {

    const {
      id
    } = issue;

    const {
      before,
      after,
      column
    } = params;

    store.updateOrder(id, before, after, column);

    // we move the issue via GitHub and rely on the automatic-dev-flow
    // to pick up the update (and react to it)

    return Promise.all([
      app.moveIssue(context, issue, column),
      app.moveReferencedIssues(context, issue, column)
    ]);

  }

  // public endpoints ////////

  app.router.get('/wuffle/board/cards', ...middlewares, (req, res) => {

    const items = store.getBoard();
    const cursor = store.getUpdateCursor();

    return filterBoardItems(req, items).then(filteredItems => {

      res.type('json').json({
        items: filteredItems,
        cursor
      });
    }).catch(err => {
      log.error('card filtering failed', err);

      res.status(500).json({ error : true });
    });
  });


  app.router.get('/wuffle/board', ...middlewares, (req, res) => {

    const {
      columns,
      name
    } = config;

    return res.type('json').json({
      columns: columns.map(c => {
        const { name } = c;

        return { name };
      }),
      name: name || 'Wuffle Board'
    });

  });


  app.router.get('/wuffle/board/updates', ...middlewares, (req, res) => {
    const cursor = req.query.cursor;

    const updates = cursor ? store.getUpdates(cursor) : [];

    return (
      filterUpdates(req, updates)
        .then(filteredUpdates => res.type('json').json(filteredUpdates))
        .catch(err => {
          log.error('update filtering failed', { cursor, updates }, err);

          res.status(500).json({ error : true });
        })
    );
  });


  app.router.post('/wuffle/board/issues/move', ...middlewares, bodyParser, async (req, res) => {

    const login = app.getGitHubLogin(req);

    if (!login) {
      return res.status(401).json({});
    }

    const body = JSON.parse(req.body);

    const {
      id,
      ...params
    } = body;

    const issue = store.getIssueById(id);

    const repo = repoAndOwner(issue);

    const canWrite = await app.canWrite(login, repo);

    if (!canWrite) {
      return res.status(403).json({});
    }

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

    return (
      moveIssue(context, issue, params)
        .then(() => {
          res.type('json').json({});
        })
        .catch(err => {
          log.error(err);

          res.status(500).json({ error : true });
        })
    );

  });

};