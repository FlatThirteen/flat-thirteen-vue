import Tone from '~/common/tone';

export const state = () => ({
  tempo: 0,
  counts: [],
  starting: false,
  playing: false,
  startTime: 0,
  endTime: 0
});

export const getters = {
  tempo: state => state.tempo,
  counts: state => state.counts,
  duration: state => state.tempo ? 60 / state.tempo : 0,
  starting: state => state.starting,
  playing: state => state.playing,
  paused: state => !state.playing,
  active: state => state.starting || state.playing,
  startTime: state => state.startTime,
  endTime: state => state.endTime
};

export const mutations = {
  setup(state, {tempo = state.tempo, counts = state.counts}) {
    state.tempo = tempo;
    state.counts = counts;
  },
  start(state) {
    state.startTime = 0;
    state.endTime = 0;
    state.starting = true;
  },
  play(state) {
    state.startTime = Tone.rightNow();
    state.starting = false;
    state.playing = true;
  },
  stop(state) {
    state.endTime = Tone.rightNow();
    state.starting = false;
    state.playing = false;
  }
};

export const actions = {
  toggle({dispatch, getters}, time) {
    if (getters.active) {
      dispatch('stop');
    } else {
      dispatch('start', time);
    }
  },
  start({commit, getters}, time = '+4n') {
    if (getters.tempo && getters.counts.length && !getters.active) {
      commit('start');
      Tone.Transport.start(time);
    }
  },
  stop({commit, getters}) {
    if (getters.active) {
      commit('stop');
      Tone.Transport.stop();
    }
  }
};
