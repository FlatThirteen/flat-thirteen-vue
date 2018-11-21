import Vue from 'vue';

import Parser from '~/common/composer/parser';
import Note from '~/common/core/note.model';

export const state = () => ({
  live: {
    backing: {},
    goal: {},
    playback: {},
    victory: {}
  },
  victory: {}
}); // state[bucket][name][beatTick] = [Note]

export const getters = {
  goalNoteCount: state => _.flatten(_.values(state.live.goal)).length,
  hasBacking: state => !!_.flatten(_.values(state.live.backing)).length,
  getNotes: state => (name, beatTick) => state.live[name][beatTick],
  asArray: state => name => _.chain(state.live[name]).toPairs().sortBy([0]).
      map((pair) => _.replace(_.toString(pair), ',', ': ')).value(),
  asString: state => name => _.toString(_.toPairs(state.live[name])),
  correct: (state, getters) => getters.asString('goal') === getters.asString('playback')
};

export const mutations = {
  clear(state, {bucket = 'live', name}) {
    Vue.set(state[bucket], name, {});
  },
  set(state, {bucket = 'live', name, notes}) {
    Vue.set(state[bucket], name, notes);
  },
  add(state, {bucket = 'live', name, beatTick, note}) {
    let phrase = state[bucket][name];
    if (phrase[beatTick]) {
      phrase[beatTick].push(note);
    } else {
      Vue.set(phrase, beatTick, [note]);
    }
  },
  remove(state, {bucket = 'live', name, beatTick, note}) {
    let phrase = state[bucket][name];
    if (phrase[beatTick]) {
      _.remove(phrase[beatTick], n => n.toString() === note.toString());
    }
  }
};

export const actions = {
  initialize({commit, dispatch, state}, {goal}) {
    // Initialize victory only in browser to avoid receiving stripped Note object.
    if (process.browser && !state.victory[10]) {
      const hiNote = new Note('cowbell', { pitch: 'A5' });
      const loNote = new Note('cowbell', { pitch: 'E5' });
      commit('set', { bucket: 'victory', name: 2, notes: { '01:096': [loNote], '02:000': [hiNote] } });
      commit('set', { bucket: 'victory', name: 3, notes: _.clone(state.victory[2]) });
      commit('add', { bucket: 'victory', name: 3, beatTick: '00:000', note: hiNote});
      commit('set', { bucket: 'victory', name: 4, notes: _.clone(state.victory[3]) });
      commit('add', { bucket: 'victory', name: 4, beatTick: '02:144', note: loNote});
      commit('set', { bucket: 'victory', name: 5, notes: _.clone(state.victory[4]) });
      commit('add', { bucket: 'victory', name: 5, beatTick: '01:000', note: loNote});
      commit('set', { bucket: 'victory', name: 6, notes: _.clone(state.victory[5]) });
      commit('add', { bucket: 'victory', name: 6, beatTick: '00:096', note: hiNote});
      commit('set', { bucket: 'victory', name: 7, notes: _.clone(state.victory[6]) });
      commit('add', { bucket: 'victory', name: 7, beatTick: '02:096', note: hiNote});
      commit('set', { bucket: 'victory', name: 8, notes: _.clone(state.victory[7]) });
      commit('add', { bucket: 'victory', name: 8, beatTick: '01:048', note: hiNote});
      commit('set', { bucket: 'victory', name: 9, notes: _.clone(state.victory[8]) });
      commit('add', { bucket: 'victory', name: 9, beatTick: '00:144', note: hiNote});
      commit('set', { bucket: 'victory', name: 10, notes: _.clone(state.victory[9]) });
      commit('add', { bucket: 'victory', name: 10, beatTick: '01:144', note: loNote});
    }
    if (_.isArray(goal)) {
      dispatch('setTracks', { name: 'goal', tracks: goal });
    } else if (_.isObject(goal)) {
      commit('set', { name: 'goal', notes: goal });
    }
  },
  setVictory({commit, state}, number) {
    let notes = state.victory[_.clamp(number, 2, 10)];
    if (notes) {
      commit('set', { name: 'victory', notes });
    }
  },
  setTracks({commit}, {name, tracks}) {
    commit('set', { name, notes: Parser.parseTracks(tracks)})
  }
};
