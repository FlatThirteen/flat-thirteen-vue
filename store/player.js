import Vue from 'vue';

import { beatTickFrom, ticks } from '~/common/core/beat-tick.model';
import Note from '~/common/core/note.model'

export const state = () => ({
  pulsesByBeat: [],
  data: {},
  selected: null,
  cursor: 0,
  touched: false
});

export const getters = {
  pulsesByBeat: state => state.pulsesByBeat,
  numPulses: state => _.sum(state.pulsesByBeat),
  cursorsFor: state => beat => {
    let offset = _.sum(state.pulsesByBeat.slice(0, beat));
    return _.times(state.pulsesByBeat[beat], (i) => offset + i);
  },
  beatTicks: state => beatTicksFrom(state.pulsesByBeat),
  beatTickFor: (state, getters) => cursor => getters.beatTicks[cursor],
  getDataFor: state => ({beatTick, soundId}) => (state.data[beatTick] || {})[soundId],
  getNotes: state => beatTick => _.map(_.values(state.data[beatTick]),
      soundName => new Note(soundName)),
  selected: state => state.selected,
  cursor: state => state.cursor,
  beatPulse: state => _.reduce(state.pulsesByBeat, ([beat, pulse, working], pulses) =>
      working && pulse >= pulses ? [beat + 1, pulse - pulses, true] : [beat, pulse],
      [0, state.cursor, true]),
  beatTick: (state, getters) => beatTickFrom(...getters.beatPulse),
  touched: state => state.touched
};

export const mutations = {
  setup(state, {pulsesByBeat, data = {}}) {
    state.pulsesByBeat = pulsesByBeat;
    state.data = data;
    state.selected = null;
    state.cursor = 0;
    state.touched = false;
  },
  setNote(state, {beatTick, soundId, soundName}) {
    if (!state.data[beatTick]) {
      Vue.set(state.data, beatTick, _.fromPairs([[soundId, soundName]]));
    } else {
      Vue.set(state.data[beatTick], soundId, soundName);
    }
    state.selected = soundId;
    state.touched = true;
  },
  unsetNote(state, {beatTick, soundId}) {
    _.forEach(_.isArray(soundId) ? soundId : [soundId], soundId => {
      if (state.data[beatTick]) {
        Vue.delete(state.data[beatTick], soundId);
      }
    });
    state.touched = true;
  },
  select(state, {cursor, soundId = state.selected}) {
    state.selected = soundId;
    state.cursor = cursor;
  },
  unselect(state) {
    state.selected = null;
    state.cursor = 0;
  },
  untouch(state) {
    state.touched = false;
  }
};

export const actions = {
  update({commit, state}, pulsesByBeat) {
    commit('setup', {pulsesByBeat,
      data: _.pick(state.data, beatTicksFrom(pulsesByBeat))
    });
  },
  move({commit, state, getters, rootGetters}, move) {
    if (!rootGetters['transport/starting']) {
      commit('select', {
        cursor: (state.cursor + move + getters.numPulses) % getters.numPulses
      });
    }
  },
  set({commit, state, getters, rootGetters}, {cursor = state.cursor, soundId = state.selected, soundName}) {
    if (!rootGetters['transport/starting']) {
      commit(soundName ? 'setNote' : 'unsetNote', {
        beatTick: getters.beatTickFor(cursor),
        soundId,
        soundName
      });
    }
  },
  unset({commit, state, getters, rootGetters}, soundId) {
    if (!rootGetters['transport/starting']) {
      commit('unsetNote', {
        beatTick: getters.beatTickFor(state.cursor),
        soundId
      });
    }
  }
};

function beatTicksFrom(pulsesByBeat) {
  return _.reduce(pulsesByBeat, (result, pulses, beat) => {
    return _.concat(result, ..._.times(pulses, pulse => {
      return beatTickFrom(beat, ticks(pulse, pulses));
    }));
  }, []);
}