/* eslint-env node */

module.exports = {
  extends: [
    'plugin:bpmn-io/browser'
  ],
  rules: {
    'comma-dangle': [ 'error', 'never' ],
    'import/no-amd': 'error',
    'import/no-webpack-loader-syntax': 'error'
  },
  plugins: [
    'svelte3',
    'import'
  ],
  overrides: [
    {
      'files': [ '*.svelte' ],
      'processor': 'svelte3/svelte3'
    }
  ],
  settings: {
    'svelte3/ignore-styles': function(attrs) {
      return attrs.lang === 'scss';
    }
  }
};