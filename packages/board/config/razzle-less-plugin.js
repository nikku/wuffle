const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PostCssFlexBugFixes = require('postcss-flexbugs-fixes');
const paths = require('razzle/config/paths');

const defaultOptions = {
  postcss: {
    dev: {
      sourceMap: true,
      ident: 'postcss',
    },
    prod: {
      sourceMap: false,
      ident: 'postcss',
    },
    plugins: [
      PostCssFlexBugFixes,
      autoprefixer({
        browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 11'],
        flexbox: 'no-2009'
      })
    ]
  },
  less: {
    dev: {
      debug: true,
      sourceMap: true,
      javascriptEnabled: true
    },
    prod: {
      sourceMap: false,
      javascriptEnabled: true
    }
  },
  css: {
    dev: {
      sourceMap: true,
      importLoaders: 1,
      modules: false,
      localIdentName: '[path][name]__[local]'
    },
    prod: {
      sourceMap: false,
      importLoaders: 1,
      modules: false,
      minimize: true
    }
  },
  style: {}
};

module.exports = (
    defaultConfig,
    { target, dev },
    webpack,
    userOptions = {}
) => {
  const isServer = target !== 'web';
  const constantEnv = dev ? 'dev' : 'prod';

  const config = Object.assign({}, defaultConfig);

  const options = Object.assign({}, defaultOptions, userOptions);

  const styleLoader = {
    loader: require.resolve('style-loader'),
    options: options.style
  };

  const cssLoader = {
    loader: require.resolve('css-loader'),
    options: options.css[constantEnv]
  };

  const postCssLoader = {
    loader: require.resolve('postcss-loader'),
    options: Object.assign({}, options.postcss[constantEnv], {
      plugins: () => options.postcss.plugins,
    })
  };

  const lessLoader = {
    loader: require.resolve('less-loader'),
    options: {
      modifyVars: {
        'primary-color': '#37ACC8',
        'border-radius-base': '3px'
      },
      ...options.less[constantEnv]
    }
  };

  config.resolve.extensions = [
    ...config.resolve.extensions,
    '.less'
  ];

  if (isServer) {
    // stub react-dragula, it is only used client-side

    config.resolve.alias = {
      'react-dragula': require.resolve('./noop')
    };
  }

  config.module.rules = [
    ...config.module.rules,
    {
      test: /\.less$/,
      exclude: [paths.appBuild],
      use: isServer
        ? [
          {
            loader: require.resolve('css-loader/locals'),
            options: options.css[constantEnv],
          },
          postCssLoader,
          lessLoader
        ]
        : [
          dev ? styleLoader : MiniCssExtractPlugin.loader,
          cssLoader,
          postCssLoader,
          lessLoader
        ]
    }
  ];

  return config;
};