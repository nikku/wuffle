/* eslint-env node */

module.exports = {
  extends: [
    'plugin:bpmn-io/browser',
    'plugin:svelte/recommended'
  ],
  rules: {
    'comma-dangle': [ 'error', 'never' ],
    'import/no-amd': 'error',
    'import/no-webpack-loader-syntax': 'error'
  },
  plugins: [
    'import'
  ],
  overrides: [
    {
      files: [ '*.svelte' ],
      parser: 'svelte-eslint-parser'
    }
  ]
};