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


/**
 * A cors allowed middleware
 *
 * @param  {Function} fn handler to be wrapped
 *
 * @return {Function} wrapped fn
 */
module.exports.cors = function cors(req, res, next) {

  // enable cors
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  next();
};

module.exports.safeAsync = function(fn) {

  return function(req, res) {

    const result = fn(req, res);

    if ('catch' in result) {

      return result.catch(error => {
        console.error('Server error in route %s', req.path, error);

        if (!res.headersSent) {
          res.status(500);
        }
      });
    }

    return result;
  };
};