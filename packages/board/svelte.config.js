const sveltePreprocess = require('svelte-preprocess');

const path = require('path');

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

module.exports = {
  preprocess: [
    sveltePreprocess({
      scss: {
        includePaths: [
          path.join(__dirname, 'src/style'),
          path.join(__dirname, 'node_modules')
        ]
      }
    }),
    {
      script: scriptProcessor([
        classProcessor(),
        emitProcessor()
      ])
    }
  ]
};