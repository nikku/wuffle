import bpmnIoPlugin from 'eslint-plugin-bpmn-io';
import graphqlPlugin from '@graphql-eslint/eslint-plugin';

const files = {
  build: [
    '*.js'
  ],
  test: [
    'test/**/*.js',
    'test/**/*.ts',
    'test/**/*.cjs'
  ],
  ignored: [
    'public',
    'tmp',
  ]
};

export default [
  {
    'ignores': files.ignored
  },

  // lib
  ...bpmnIoPlugin.configs.node.map(config => {

    return {
      ...config,
      ignores: [
        ...files.build,
        ...files.test
      ]
    };
  }),
  {
    files: [ '**/*.graphql', '**/*.js' ],
    ignores: [
      ...files.build,
      ...files.test
    ],
    processor: graphqlPlugin.processor
  },
  {
    files: [ '**/*.graphql' ],
    languageOptions: {
      parser: graphqlPlugin.parser
    },
    plugins: {
      '@graphql-eslint': graphqlPlugin
    },
    rules: graphqlPlugin.configs['schema-recommended'].rules
  },

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