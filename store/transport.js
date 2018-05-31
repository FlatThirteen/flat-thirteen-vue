import Tone from '~/common/tone';

export const state = () => ({
  ready: false,
  starting: false,
  playing: false,
  startTime: 0,
  endTime: 0
});

export const actions = {
  toggle({dispatch, state}, time) {
    if (state.playing || state.starting) {
      dispatch('stop');
    } else {
      dispatch('start', time);
    }
  },
  start({commit, state}, time = '+4n') {
    if (state.ready && !state.starting && !state.playing) {
      commit('start');
      Tone.Transport.start(time);
    }
  },
  stop({commit}) {
    commit('stop');
    Tone.Transport.stop();
  }
};

export const mutations = {
  ready(state) {
    state.ready = true;
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

export const getters = {
  starting: state => state.starting,
  playing: state => state.playing,
  paused: state => !state.playing,
  startTime: state => state.startTime,
  endTime: state => state.endTime
};
