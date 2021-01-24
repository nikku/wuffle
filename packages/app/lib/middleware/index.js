const {
  randomString
} = require('../util');

const session = require('express-session');

const MemoryStore = require('memorystore')(session);

const ONE_DAY = 1000 * 60 * 60 * 24;
const SEVEN_DAYS = ONE_DAY * 7;

module.exports.withSession = session({
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

module.exports.useHttps = function(baseUrl) {

  return function(req, res, next) {

    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.header('strict-transport-security', 'max-age=31536000; preload');

      return next();
    }

    return res.redirect(302, baseUrl + req.originalUrl);
  };

};