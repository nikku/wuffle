import { randomString } from '../util/index.js';

import session from 'express-session';
import MemoryStoreFactory from 'memorystore';

const MemoryStore = MemoryStoreFactory(session);

const ONE_DAY = 1000 * 60 * 60 * 24;
const SEVEN_DAYS = ONE_DAY * 7;

export const withSession = session({
  secret: process.env.SESSION_SECRET || randomString(),
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: ONE_DAY
  }),
  cookie: {
    maxAge: SEVEN_DAYS,
    sameSite: 'lax',
    secure: 'auto'
  }
});

export function useHttps(baseUrl) {

  return function(req, res, next) {

    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.header('strict-transport-security', 'max-age=31536000; preload');

      return next();
    }

    return res.redirect(302, baseUrl + req.originalUrl);
  };
}