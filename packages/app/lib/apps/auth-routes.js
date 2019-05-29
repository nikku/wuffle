const { URLSearchParams } = require('url');

const fetch = require('node-fetch');

const {
  withSession,
  cors
} = require('../middleware');

const {
  randomString
} = require('../util');


/**
 * This component implements login, logout and login_check routes for
 * the front-end.
 *
 * Under the hood, it uses GitHub's APIs to perform user authentication
 * via OAuth.
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

  const log = app.log.child({
    name: 'wuffle:auth-flow'
  });

  /**
   * Trigger login via GitHub OAuth flow.
   */
  app.router.get('/wuffle/login', ...middlewares, (req, res) => {

    const state = randomString();

    const redirectTo = safeGetReferer(req, getClientBaseUrl(), '/board');

    req.session.login = {
      redirectTo,
      state
    };

    const params = new URLSearchParams();
    params.append('client_id', process.env.GITHUB_CLIENT_ID);
    params.append('state', state);
    params.append('scope', 'public_repo,repo');
    params.append('redirect_uri', appUrl('/wuffle/login/callback'));

    return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  });


  /**
   * Trigger login via GitHub OAuth flow.
   */
  app.router.get('/wuffle/logout', ...middlewares, (req, res) => {

    const redirectTo = clientUrl('/board');

    return req.session.destroy(function(err) {
      return res.redirect(redirectTo);
    });

  });


  /**
   * Handle login callback received from GitHub OAuth flow.
   */
  app.router.get('/wuffle/login/callback', ...middlewares, async (req, res) => {

    const {
      state,
      code
    } = req.query;

    const login = req.session.login;

    if (state !== login.state) {
      log.warn('state missmatch, aborting');

      return res.redirect(login.redirectTo);
    }

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('state', state);
    params.append('client_id', process.env.GITHUB_CLIENT_ID);
    params.append('client_secret', process.env.GITHUB_CLIENT_SECRET);
    params.append('redirect_uri', appUrl('/wuffle/login/callback'));

    const githubAuth = await fetch('https://github.com/login/oauth/access_token', {
      headers: {
        'Accept': 'application/json'
      },
      method: 'POST',
      body: params
    }).then(res => {

      if (res.status >= 400) {
        throw new Error('FAILED');
      }

      return res.text();
    }).then(text => JSON.parse(text));

    // remove login token
    delete req.session.login;

    req.session.githubAuth = githubAuth;

    res.redirect(login.redirectTo);
  });


  /**
   * Retrieve logged in user information.
   */
  app.router.get('/wuffle/login_check', ...middlewares, async (req, res) => {

    const {
      session
    } = req;

    const logContext = {
      session_id: session.id
    };

    const {
      githubAuth,
      githubProfile
    } = session;

    const token = githubAuth && githubAuth.access_token;

    if (githubProfile) {
      return res.json(githubProfile);
    }

    if (!token) {
      return res.json(null);
    }

    try {
      const user = await app.getAuthenticated(token);

      log.info(logContext, 'fetched GitHub profile');

      session.githubProfile = {
        login: user.login,
        avatar_url: user.avatar_url
      };

      return res.json(session.githubProfile);
    } catch (error) {
      log.warn(logContext, 'failed to retrieve GitHub profile', error);

      return res.json(null);
    }
  });


  // api ///////////////////////

  app.getGitHubToken = function(req) {
    return req.session && req.session.githubAuth && req.session.githubAuth.access_token;
  };

  app.getGitHubLogin = function(req) {
    return req.session && req.session.githubProfile && req.session.githubProfile.login;
  };

};


// helpers ///////////////////////

function getBaseUrl() {
  return process.env.BASE_URL || 'http://localhost:3000';
}

function getClientBaseUrl() {
  return process.env.CLIENT_BASE_URL || process.env.BASE_URL || 'http://localhost:3001';
}

function relativeUrl(baseUrl, location) {
  return `${baseUrl}${location}`;
}

function clientUrl(location) {
  return relativeUrl(getClientBaseUrl(), location);
}

function appUrl(location) {
  return relativeUrl(getBaseUrl(), location);
}

function isChildUrl(url, base) {
  return url.startsWith(base);
}

function safeGetReferer(req, base, fallbackUrl) {
  const referer = req.get('referer');

  if (referer && isChildUrl(referer, base)) {
    return referer;
  }

  return relativeUrl(base, fallbackUrl);
}