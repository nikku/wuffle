module.exports = {
  plugins: [ require('./config/razzle-less-plugin') ],
  modify: (config, { target, dev }, webpack) => {

    delete config.externals;

    return config;
  },
};