import { URLSearchParams } from 'node:url';

import { withSession } from '../../middleware/index.js';
import { randomString } from '../../util/index.js';


/**
 * @typedef {import('../../types.js').Session} WuffleSession
 * @typedef {import('express').Request} Request
 * @typedef {import('../../types.js').GitHubUser} GitHubUser
 */

/**
 * This component implements login, logout and login_check routes for
 * the front-end.
 *
 * Under the hood, it uses GitHub's APIs to perform user authentication
 * via OAuth.
 *
 * @constructor
 *
 * @param {import('../../types.js').Logger} logger
 * @param {import('../../types.js').Router} router
 * @param {import('../security-context/SecurityContext.js').default} securityContext
 */
export default function AuthRoutes(logger, router, securityContext) {

  const middlewares = [
    withSession
  ];

  const log = logger.child({
    name: 'wuffle:auth-flow'
  });

  // five minutes
  const CHECK_INTERVAL = 1000 * 60 * 5;

  /**
   * Trigger login via GitHub OAuth flow.
   */
  router.get('/wuffle/login', ...middlewares, (req, res) => {

    const state = randomString();

    const redirectTo = safeGetReferer(req, '/board');

    const session = /** @type {WuffleSession} */ (req.session);

    const logContext = {
      session_id: session.id
    };

    log.debug(logContext, 'redirecting to GitHub');

    session.loginFlow = {
      t: Date.now(),
      redirectTo,
      state
    };

    const params = new URLSearchParams();
    params.append('client_id', process.env.GITHUB_CLIENT_ID);
    params.append('state', state);
    params.append('redirect_uri', appUrl('/wuffle/login/callback'));

    return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  });


  /**
   * Trigger login via GitHub OAuth flow.
   */
  router.get('/wuffle/logout', ...middlewares, (req, res) => {

    const redirectTo = safeGetReferer(req, '/board');

    const {
      id: session_id
    } = /** @type WuffleSession */ (req.session);

    log.debug({ session_id }, 'logging out');

    return req.session.destroy(function(err) {
      return res.redirect(redirectTo);
    }) && null;

  });


  /**
   * Handle login callback received from GitHub OAuth flow.
   */
  router.get('/wuffle/login/callback', ...middlewares, async (req, res) => {

    const {
      state,
      code
    } = req.query;

    const session = /** @type {WuffleSession} */ (req.session);

    const {
      loginFlow,
      id: session_id
    } = session;

    const logContext = {
      session_id
    };

    log.debug(logContext, 'return from GitHub');

    if (!loginFlow) {
      log.warn(logContext, 'no active login flow');

      return res.redirect(safeGetReferer(req, '/'));
    }

    delete session.loginFlow;

    if (state !== loginFlow.state) {
      log.warn(logContext, 'state missmatch, aborting');

      return res.redirect(loginFlow.redirectTo);
    }

    const params = new URLSearchParams();
    params.append('code', /** @type {string} */ (code));
    params.append('state', /** @type {string} */ (state));
    params.append('client_id', process.env.GITHUB_CLIENT_ID);
    params.append('client_secret', process.env.GITHUB_CLIENT_SECRET);
    params.append('redirect_uri', appUrl('/wuffle/login/callback'));

    const {
      access_token
    } = await fetch(`https://github.com/login/oauth/access_token?${params.toString()}`, {
      headers: {
        'Accept': 'application/json'
      },
      method: 'POST'
    }).then(res => {

      if (res.status >= 400) {
        throw new Error('failed to retrieve access_token');
      }

      return res.text();
    }).then(text => JSON.parse(text));

    log.debug(logContext, 'fetched access token');

    const {
      login,
      avatar_url
    } = await securityContext.getAuthenticatedUser(access_token);

    session.githubUser = {
      last_checked: Date.now(),
      access_token,
      avatar_url,
      login
    };

    log.info({
      ...logContext,
      login,
      t: Date.now() - loginFlow.t
    }, 'login successful');

    res.redirect(loginFlow.redirectTo);
  });


  /**
   * Retrieve logged in user information.
   */
  router.get('/wuffle/login_check', ...middlewares, async (req, res) => {

    const session = /** @type {WuffleSession} */ (req.session);

    const {
      id: session_id,
      githubUser
    } = session;

    if (!githubUser) {
      return res.type('json').json(null) && null;
    }

    const {
      last_checked,
      access_token,
      avatar_url,
      login
    } = githubUser;

    const logContext = {
      session_id,
      login
    };

    if (last_checked + CHECK_INTERVAL < Date.now()) {
      try {

        log.debug(logContext, 'checking GitHub authentication');

        await securityContext.getAuthenticatedUser(access_token);

        githubUser.last_checked = Date.now();
      } catch (err) {

        log.debug({
          ...logContext,
          err
        }, 'failed to check GitHub authentication');

        // access is not granted anymore, clear current session
        return req.session.destroy(function(err) {
          return res.type('json').json(null);
        }) && null;
      }
    }

    return res.type('json').json({
      login,
      avatar_url
    }) && null;

  });


  // api ///////////////////////

  /**
   * @param {Request} req
   *
   * @return {GitHubUser?}
   */
  this.getGitHubUser = function(req) {

    const session = /** @type {WuffleSession} */ (req.session);

    return session && session.githubUser;
  };

}


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