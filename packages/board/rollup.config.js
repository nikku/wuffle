/* eslint-env node */

const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const url = require('@rollup/plugin-url');
const terser = require('@rollup/plugin-terser');

const copy = require('rollup-plugin-copy');
const css = require('rollup-plugin-css-only');
const svelte = require('rollup-plugin-svelte');
const livereload = require('rollup-plugin-livereload');

const { string } = require('rollup-plugin-string');

const svelteConfig = require('./svelte.config');

const distDirectory = '../app/public';

const production = !process.env.ROLLUP_WATCH;

module.exports = [
  {
    input: 'src/main.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: distDirectory + '/bundle.js'
    },
    plugins: [
      copy({
        targets: [
          { src: 'public/*', dest: distDirectory }
        ]
      }),
      url({
        fileName: '[dirname][filename][extname]',
        publicPath: '/board/'
      }),
      svelte({

        compilerOptions: {

          // enable run-time checks during development
          dev: !production,

          immutable: true
        },

        preprocess: svelteConfig.preprocess
      }),

      css({ output: 'bundle.css' }),

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