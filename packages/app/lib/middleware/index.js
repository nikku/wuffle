const {
  randomString
} = require('../util');


module.exports.withSession = require('express-session')({
  secret: process.env.SESSION_SECRET || randomString(),
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: false
  }
});