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
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
    '~/plugins/event-bus.js',
    { src: '~/plugins/pixi', ssr: false }
  ],
  router: {
    middleware: 'transport'
  },
  /*
  ** Build configuration
  */
  build: {
    vendor: [
      'gsap',
      'pixi.js',
      'Tone'
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
