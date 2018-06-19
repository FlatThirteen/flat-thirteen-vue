import Tone from '~/common/tone';

export const state = () => ({
  tempo: 0,
  numBeats: 0,
  beatsPerMeasure: [],
  counts: [],
  starting: false,
  playing: false,
  startTime: 0,
  endTime: 0
});

export const getters = {
  tempo: state => state.tempo,
  numBeats: state => state.numBeats,
  beatsPerMeasure :state => state.beatsPerMeasure,
  counts: state => state.counts,
  duration: state => 60 / state.tempo,
  starting: state => state.starting,
  playing: state => state.playing,
  paused: state => !state.playing,
  active: state => state.starting || state.playing,
  startTime: state => state.startTime,
  endTime: state => state.endTime
};

export const mutations = {
  setup(state, {tempo = state.tempo, numBeats = state.numBeats,
      beatsPerMeasure = state.beatsPerMeasure, counts = state.counts}) {
    state.tempo = tempo;
    state.numBeats = numBeats;
    state.beatsPerMeasure = beatsPerMeasure;
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
  toggle({dispatch, state}, time) {
    if (state.playing || state.starting) {
      dispatch('stop');
    } else {
      dispatch('start', time);
    }
  },
  start({commit, state}, time = '+4n') {
    if (state.tempo && state.numBeats && !state.starting && !state.playing) {
      commit('start');
      Tone.Transport.start(time);
    }
  },
  stop({commit, state}) {
    if (state.starting || state.playing) {
      commit('stop');
      Tone.Transport.stop();
    }
  }
};
