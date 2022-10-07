/* eslint-env node */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url';

import copy from 'rollup-plugin-copy';

import css from 'rollup-plugin-css-only';
import svelte from 'rollup-plugin-svelte';
import livereload from 'rollup-plugin-livereload';

import { terser } from 'rollup-plugin-terser';
import { string } from 'rollup-plugin-string';

const svelteConfig = require('./svelte.config');

const distDirectory = '../app/public';

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