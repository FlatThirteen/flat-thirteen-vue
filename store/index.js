import Vue from 'vue';

export const state = () => ({
  keyMode: false,
  keysHeld: {},
  keyDown: null,
  keyUp: null
});

export const getters = {
  keyMode: state => state.keyMode,
  keysHeld: state => state.keysHeld,
  oneKeyHeld: state => _.size(state.keysHeld) === 1,
  noKeysHeld: state => !_.size(state.keysHeld),
  keyDown: state => state.keyDown,
  keyUp: state => state.keyUp,
};

export const mutations = {
  keyDown(state, {key}) {
    state.keyMode = key !== 'Enter';
    Vue.set(state.keysHeld, key, true);
    state.keyDown = key;
    state.keyUp = null;
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
  },
  keyClear(state) {
    state.keyDown = null;
    state.keyUp = null;
    _.forEach(state.keysHeld, (truth, key) => {
      Vue.delete(state.keysHeld, key);
    });
  }
};


export const actions = {
  disableKeyMode({commit, state}) {
    if (state.keyMode) {
      commit('keyMode');
    }
  }
};
