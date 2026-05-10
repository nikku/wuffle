import GithubComments from './GithubComments.js';
import GithubCommentsBackend from './GithubCommentsBackend.js';

export default {
  __init__: [ 'githubComments' ],
  githubComments: [ 'type', GithubComments ],
  githubCommentsBackend: [ 'type', GithubCommentsBackend ]
};