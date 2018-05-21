export const state = () => ({
  starting: false,
  playing: false,
  bpm: 0
});

export const mutations = {
  starting() {
    state.starting = true;
  },
  playing() {
    state.starting = false;
    state.playing = true;
  },
  bpm(bpm) {
    state.bpm = bpm;
  }
};
