import Vue from 'vue';

export const state = () => ({
  keyMode: false,
  keysHeld: {},
  keyDown: null,
  keyUp: null,
  keyLocation: null
});

export const getters = {
  keyMode: state => state.keyMode,
  keysHeld: state => state.keysHeld,
  oneKeyHeld: state => _.size(state.keysHeld) === 1,
  noKeysHeld: state => !_.size(state.keysHeld),
  keyDown: state => state.keyDown,
  keyUp: state => state.keyUp,
  keyLocation: state => state.keyLocation
};

export const mutations = {
  keyDown(state, {key, location}) {
    state.keyMode = key !== 'Enter';
    Vue.set(state.keysHeld, key, true);
    state.keyDown = key;
    state.keyUp = null;
    state.keyLocation = location;
  },
  keyUp(state, {key}) {
    Vue.delete(state.keysHeld, key);
    if (state.keyDown === key) {
      state.keyDown = null;
    }
    state.keyUp = key;
  },
  keyMode(state, mode) {
    state.keyMode = !!mode;
  }
};
