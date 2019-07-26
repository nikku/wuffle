const { URLSearchParams } = require('url');

const fetch = require('node-fetch');

const {
  withSession
} = require('../../middleware');

const {
  randomString
} = require('../../util');


/**
 * This component implements login, logout and login_check routes for
 * the front-end.
 *
 * Under the hood, it uses GitHub's APIs to perform user authentication
 * via OAuth.
 *
 * @param {Logger} app
 * @param {Router} router
 * @param {SecurityContext} securityContext
 */
function AuthRoutes(logger, router, securityContext) {

  const middlewares = [
    withSession
  ];

  const log = logger.child({
    name: 'wuffle:auth-flow'
  });

  /**
   * Trigger login via GitHub OAuth flow.
   */
  router.get('/wuffle/login', ...middlewares, (req, res) => {

    const state = randomString();

    const redirectTo = safeGetReferer(req, '/board');

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
  router.get('/wuffle/logout', ...middlewares, (req, res) => {

    const redirectTo = safeGetReferer(req, '/board');

    return req.session.destroy(function(err) {
      return res.redirect(redirectTo);
    });

  });


  /**
   * Handle login callback received from GitHub OAuth flow.
   */
  router.get('/wuffle/login/callback', ...middlewares, async (req, res) => {

    const {
      state,
      code
    } = req.query;

    const login = req.session.login;

    if (!login) {
      log.warn('missing login state');

      return res.redirect(safeGetReferer(req, '/'));
    }

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
  router.get('/wuffle/login_check', ...middlewares, async (req, res) => {

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
      return res.type('json').json(githubProfile);
    }

    if (!token) {
      return res.type('json').json(null);
    }

    try {
      const user = await securityContext.getAuthenticatedUser(token);

      log.info(logContext, 'fetched GitHub profile');

      session.githubProfile = {
        login: user.login,
        avatar_url: user.avatar_url
      };

      return res.type('json').json(session.githubProfile);
    } catch (error) {
      log.warn(logContext, 'failed to retrieve GitHub profile', error);

      return res.type('json').json(null);
    }
  });


  // api ///////////////////////

  this.getGitHubToken = function(req) {
    return req.session && req.session.githubAuth && req.session.githubAuth.access_token;
  };

  this.getGitHubLogin = function(req) {
    return req.session && req.session.githubProfile && req.session.githubProfile.login;
  };

}


module.exports = AuthRoutes;


// helpers ///////////////////////

function getBaseUrl() {
  return process.env.BASE_URL || 'http://localhost:3000';
}

function relativeUrl(baseUrl, location) {
  return `${baseUrl}${location}`;
}

function appUrl(location) {
  return relativeUrl(getBaseUrl(), location);
}

function isChildUrl(url, base) {
  return url.startsWith(base);
}

function safeGetReferer(req, fallbackUrl) {
  const referer = req.get('referer');

  const base = getBaseUrl();

  if (referer) {
    if (
      isChildUrl(referer, base)
    ) {
      return referer;
    }
  }

  return relativeUrl(base, fallbackUrl);
}