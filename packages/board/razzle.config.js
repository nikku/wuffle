module.exports = {
  plugins: [ require('./config/razzle-less-plugin') ],
  modify: (config, { target, dev }, webpack) => {

    delete config.externals;

    if (target === 'node' && !dev) {

      // remove define plug-in definitions
      const definePlugin = config.plugins[0];

      Object.keys(definePlugin.definitions).forEach(key => {
        if (key === 'process.env.PORT' || key === 'process.env.HOST') {
          definePlugin.definitions[key] = key;
        }
      });

    }

    return config;
  }
};