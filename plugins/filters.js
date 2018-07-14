import Vue from 'vue'

Vue.filter('floor', function (value) {
  return _.floor(value);
});
