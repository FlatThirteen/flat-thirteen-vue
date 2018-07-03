import Vue from 'vue';

export const state = () => ({
  pulseBeat: '1111',
  keyMode: false,
  keysHeld: {},
  keyDown: null,
  keyUp: null,
  keyLocation: null
});

export const getters = {
  pulseBeat: state => state.pulseBeat,
  pulseBeatPerMeasure: state => _.map(_.split(state.pulseBeat, ','), (pulses) =>
    _.chain(_.split(pulses, '')).map(_.toNumber).filter(value =>
      _.inRange(value, 1, 5)).value()
  ),
  beatsPerMeasure: (state, getters) => _.map(getters.pulseBeatPerMeasure, 'length'),
  pulsesByBeat: (state, getters) => _.flatten(getters.pulseBeatPerMeasure),
  keyMode: state => state.keyMode,
  keysHeld: state => state.keysHeld,
  oneKeyHeld: state => _.size(state.keysHeld) === 1,
  noKeysHeld: state => !_.size(state.keysHeld),
  keyDown: state => state.keyDown,
  keyUp: state => state.keyUp,
  keyLocation: state => state.keyLocation
};

export const mutations = {
  pulseBeat(state, pulseBeat) {
    state.pulseBeat = pulseBeat;
  },
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


export const actions = {
  disableKeyMode({commit, state}) {
    if (state.keyMode) {
      commit('keyMode');
    }
  }
};
