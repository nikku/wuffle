import bpmnIoPlugin from 'eslint-plugin-bpmn-io';
import sveltePlugin from 'eslint-plugin-svelte';

const files = {
  build: [
    '*.js'
  ],
  test: [
    'test/**/*.js',
    'test/**/*.ts',
    'test/**/*.cjs'
  ],
  ignored: [ ]
};

export default [
  {
    'ignores': files.ignored
  },

  // lib
  ...sveltePlugin.configs['flat/recommended'].map(config => {

    return {
      ...config,
      ignores: [
        ...files.build,
        ...files.test
      ]
    };
  }),
  ...bpmnIoPlugin.configs.browser.map(config => {

    return {
      ...config,
      ignores: [
        ...files.build,
        ...files.test
      ]
    };
  }),

  // build + test
  ...bpmnIoPlugin.configs.node.map(config => {

    return {
      ...config,
      files: [
        ...files.build,
        ...files.test
      ]
    };
  }),

  // test
  ...bpmnIoPlugin.configs.mocha.map(config => {

    return {
      ...config,
      files: files.test
    };
  })
];