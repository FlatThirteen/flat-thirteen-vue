import Vue from 'vue';

import Parser from '~/common/composer/parser';
import BeatTick from '~/common/core/beat-tick.model';
import Note from '~/common/core/note.model';
import Tone from '~/common/tone';

export const state = () => ({
  live: {
    backing: {},
    finale: {},
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
  correct: state => _.size(state.live.goal) === _.size(state.live.playback) &&
      _.every(state.live.goal, (notes, beatTick) => !_.xor(_.invokeMap(notes, 'toString'),
          _.invokeMap(state.live.playback[beatTick], 'toString')).length)
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
  clear({commit}, name){
    commit('clear', {name});
  },
  setVictory({commit, state}, number) {
    let notes = state.victory[_.clamp(number, 2, 10)];
    if (notes) {
      commit('set', { name: 'victory', notes });
    }
  },
  setFinale({commit}, {part, number, backing, alternate}) {
    if (backing !== 'none') {
      let rootNote = ['D2', 'E2', 'F2', 'G2'][part];
      let pitches = _.map([0, -5, -2, 3, 4], interval =>
        new Tone.Frequency(rootNote).transpose(interval).toNote());
      let rhythm = '%1,%2|%3,%1|,%2|' + (part < 3 ? '%3,%1' : '%4,%5,%1,');
      let notes = Parser.parseTracks([{
        type: 'sawtooth6',
        notes: _.reduceRight(pitches, (template, pitch, index) =>
            _.replace(template, new RegExp('%' + (index + 1), 'g'), pitch), rhythm)
      }]);
      commit('set', { name: 'finale', notes });
    } else {
      commit('clear', { name: 'finale' });
    }
    let rootNote = ['D6', 'E6', 'F6', 'G6'][part];
    let sequence = [0, -5, 2, -5, 4, 0, 2, -5, 4, -5, 0, 2, 4, 0, 7, part < 3 || !alternate ? 0 : 9];
    let order = _.take([0, 6, 8, 12, 10, 4, 2, 14, 11, 5, 13, 9, 3, 7, 1, 15], number);
    _.forEach(order, index => {
      commit('add', {
        name: 'finale',
        beatTick: BeatTick.from(index >> 2, index % 4, 4),
        note: new Note('cowbell', {
          pitch: new Tone.Frequency(rootNote).transpose(sequence[index]).toNote()
        })
      });
    });
  },
  setBonusStart({commit}, {layout, backing}) {
    let tracks = [
      { type: 'drums', notes: ['K,|K,K|, K|K', 'K,|K,S|, K|S', 'K,|K,K.S|, K|K.S'][layout]},
      { type: 'cowbell', notes: 'A6,A7|A7,A6|A7,A7|A6,' },
      { type: 'sawtooth6', notes: { bass: 'A2,G2|E2,G2|,G2|A2,' }[backing]}
    ];
    commit('set', { name: 'finale', notes: Parser.parseTracks(tracks) })
  },
  setBonusSuccess({commit}, {layout, backing}) {
    let tracks = [
      { type: 'drums', notes: ['K,,,K|K,,,K|K,,K,K|K', 'K,,S,K|K,,S,K|K,K,S,K|K', 'K,,K.S,K|S.K,,K.S,K|S.K,S,K.S,K|K.S'][layout]},
      { type: 'cowbell', notes: 'A5,,A5,A5| E5,A5,E5,E5| A5,,,E6|A6' },
      { type: 'sawtooth6', notes: { bass: 'F2,F1|G2,G1|A2,E2,G2,A2|A1,' }[backing]}
    ];
    commit('set', { name: 'finale', notes: Parser.parseTracks(tracks) })
  },
  setTracks({commit}, {name, tracks, numBeats}) {
    commit('set', { name, notes: Parser.parseTracks(tracks, numBeats)})
  }
};
