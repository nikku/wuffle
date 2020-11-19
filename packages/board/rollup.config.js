import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url';

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

        preprocess: svelteConfig.preprocess
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