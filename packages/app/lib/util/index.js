const {
  Cache,
  NoopCache
} = require('./cache');

const {
  findLinks,
  linkTypes
} = require('./links');

const {
  parseSearch,
  parseTemporalFilter
} = require('./search');

const preExit = require('./pre-exit');

const {
  repoAndOwner,
  issueIdent
} = require('./meta');

const crypto = require('crypto');

module.exports.randomString = function randomString(length=64) {
  return crypto.randomBytes(length).toString('base64');
};

module.exports.preExit = preExit;

module.exports.Cache = Cache;

module.exports.NoopCache = NoopCache;

module.exports.findLinks = findLinks;

module.exports.linkTypes = linkTypes;

module.exports.parseSearch = parseSearch;
module.exports.parseTemporalFilter = parseTemporalFilter;

module.exports.repoAndOwner = repoAndOwner;

module.exports.issueIdent = issueIdent;