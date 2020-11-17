import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url';

import svelte from 'rollup-plugin-svelte';
import livereload from 'rollup-plugin-livereload';

import { terser } from 'rollup-plugin-terser';
import { string } from 'rollup-plugin-string';

import { sass } from 'svelte-preprocess-sass';

const distDirectory = '../app/public';

function scriptProcessor(processors) {

  return function(options) {

    const {
      content,
      ...rest
    } = options;

    const code = processors.reduce((content, processor) => {
      return processor({
        content,
        ...rest
      }).code;
    }, content);

    return {
      code
    };
  };
}

function classProcessor() {

  function process(content) {
    return (
      content
        .replace(
          /export let className([;\n= ]{1})/g,
          'export { className as class }; let className$1'
        )
    );
  }

  return function(options) {

    const {
      content
    } = options;

    const code = process(content);

    return {
      code
    };
  };
}


function emitProcessor() {

  function process(content) {

    if (/\$\$emit\(/.test(content)) {

      content = `
import { createEventDispatcher } from 'svelte';

const __dispatch = createEventDispatcher();

${content}`;

      content = content.replace(/\$\$emit\(/g, '__dispatch(');
    }

    return content;
  }

  return function(options) {

    const {
      content
    } = options;

    const code = process(content);

    return {
      code
    };
  };
}


const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: 'src/main.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: distDirectory + '/bundle.js'
    },
    plugins: [
      url({
        fileName: '[dirname][filename][extname]',
        publicPath: '/board/'
      }),
      svelte({

        // enable run-time checks during development
        dev: !production,
        immutable: true,

        // we'll extract any component CSS out into
        // a separate file — better for performance
        css: css => {
          css.write('bundle.css');
        },
        preprocess: {
          style: sass({
            includePaths: [
              'src/style',
              'node_modules'
            ]
          }, { name: 'scss' }),
          script: scriptProcessor([
            classProcessor(),
            emitProcessor()
          ])
        }
      }),

      resolve(),
      commonjs(),

      // live reload in development mode
      !production && livereload(distDirectory),

      // minify in production
      production && terser()
    ],
    watch: {
      clearScreen: false
    }
  },
  {
    input: 'src/service-worker.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'serviceWorker',
      file: distDirectory + '/service-worker.js'
    },
    plugins: [
      resolve(),
      commonjs(),

      string({
        include: '**/*.svg'
      }),

      // minify in production
      production && terser()
    ]
  }
];