const {
  randomString
} = require('../util');

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

module.exports.withSession = require('express-session')({
  secret: process.env.SESSION_SECRET || randomString(),
  resave: false,
  saveUninitialized: true,
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