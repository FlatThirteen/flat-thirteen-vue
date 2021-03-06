const path = require('path');
const webpack = require('webpack');

module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'Flat Thirteen',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no' },
      { hid: 'description', name: 'description', content: 'Flat Thirteen' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  css: [
    '~/assets/stylus/common.styl',
    './assets/stylus/button.styl'
  ],
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#008FFF' },
  plugins: [
    '~/plugins/axios.js',
    '~/plugins/constants.js',
    '~/plugins/filters.js',
    '~/plugins/event-bus.js',
    { src: '~/plugins/pixi', ssr: false }
  ],
  router: {
    middleware: 'transport',
    base: process.env.DEPLOY_ENV === 'GH_PAGES' ? '/flat-thirteen-vue/' : ''
  },
  /*
  ** Build configuration
  */
  build: {
    vendor: [
      'axios',
      'gameanalytics',
      'gsap',
      'pixi.js',
      'tone',
      'vue-axios'
    ],
    plugins: [
      new webpack.ProvidePlugin({
        '_': 'lodash'
      }),
      new webpack.LoaderOptionsPlugin({
        options: {
          stylus: {
            import: [
              path.resolve(__dirname, './assets/stylus/variables.styl'),
              path.resolve(__dirname, './assets/stylus/mixin.styl'),
              path.resolve(__dirname, './assets/stylus/colors.styl')
            ]
          }
        }
      })
    ],
    /*
    ** Run ESLint on save
    */
    extend (config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
};
