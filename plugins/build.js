import Vue from 'vue';

const build = {};

build.install = function (Vue) {
  if (process.browser) {
    Vue.axios.get('/BUILD').then((response) => {
      Vue.prototype.$build = response.data.trim();
    }).catch((error) => {
      Vue.prototype.$build = 'BUILD ' + error.message
    });
  } else {
    Vue.prototype.$build = '...'
  }
};

Vue.use(build);
