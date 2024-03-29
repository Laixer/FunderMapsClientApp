const path = require("path");
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//     .BundleAnalyzerPlugin;

module.exports = {
  // pwa: {
  //   workboxPluginMode: 'InjectManifest',
  //   workboxOptions: {
  //     swSrc: 'src/service-worker.js',
  //     exclude: [
  //       /\.map$/,
  //       /manifest\.json$/
  //     ],
  //   },
  //   themeColor: '#1da025'
  // },
  css: {
    loaderOptions: {
      scss: {
        prependData: `@import "@/assets/scss/common/common.scss";`,
      },
    },
  },
  configureWebpack: {
    resolve: {
      alias: {
        config: path.resolve(__dirname, "src/config"),

        // Components
        atom: path.resolve(__dirname, "src/components/atoms"),
        molecule: path.resolve(__dirname, "src/components/molecules"),
        organism: path.resolve(__dirname, "src/components/organisms"),

        // Data
        model: path.resolve(__dirname, "src/models"),
        service: path.resolve(__dirname, "src/services"),
        api: path.resolve(__dirname, "src/api"),

        // Helper
        utils: path.resolve(__dirname, "src/utils"),
        helper: path.resolve(__dirname, "src/helpers"),

        // Mixins
        mixin: path.resolve(__dirname, "src/mixins"),
      },
    },
    // plugins: [ new BundleAnalyzerPlugin() ]
  },
};
