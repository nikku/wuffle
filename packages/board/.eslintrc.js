module.exports = {
  extends: [
    'plugin:bpmn-io/es6'
  ],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module'
  },
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
      'files': ['*.svelte'],
      'processor': 'svelte3/svelte3'
    }
  ],
  env: {
    browser: true,
    es6: true
  },
  settings: {
    'svelte3/ignore-styles': function(attrs) {
      return attrs.lang === 'scss';
    }
  }
};