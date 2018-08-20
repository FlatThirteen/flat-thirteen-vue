import Vue from 'vue';

import { beatTickFrom, ticks } from '~/common/core/beat-tick.model';
import Note from '~/common/core/note.model'

export const state = () => ({
  pulseBeat: '', // '1234,4321'
  layout: [], // [{ soundByKey: { q: 'snare', a: 'kick' } }]
  data: {}, // data[beatTick][soundId] = soundName
  selected: null,
  cursor: 0,
  touched: false
});

export const getters = {
  pulseBeat: state => state.pulseBeat,
  pulseBeatPerMeasure: state => _.map(_.split(state.pulseBeat, ','), (pulses) =>
    _.chain(_.split(pulses, '')).map(_.toNumber).filter(value =>
      _.inRange(value, 1, 5)).value()
  ),
  beatsPerMeasure: (state, getters) => _.map(getters.pulseBeatPerMeasure, 'length'),
  pulsesByBeat: (state, getters) => _.flatten(getters.pulseBeatPerMeasure),
  numPulses: (state, getters) => _.sum(getters.pulsesByBeat),
  cursorsByBeat: (state, getters) => _.reduce(getters.pulsesByBeat, ({result, offset}, pulses) => ({
    result: _.concat(result, [_.times(pulses, (i) => offset + i)]),
    offset: offset + pulses
  }), { result: [], offset: 0 }).result,
  beatTicks: (state, getters) => beatTicksFrom(getters.pulsesByBeat),
  layout: state => state.layout,
  soundByKey: state => _.map(state.layout, 'soundByKey'),
  soundIds: (state, getters) => _.map(getters.soundByKey, (soundByKey) => _.join(_.keys(soundByKey))),
  soundNames: (state, getters) => _.flatMap(getters.soundByKey, _.values),
  getDataFor: state => ({beatTick, soundId}) => (state.data[beatTick] || {})[soundId],
  getNotes: state => beatTick => _.map(_.values(state.data[beatTick]),
      soundName => new Note(soundName)),
  notes: state => _.flatten(_.map(_.values(state.data), _.values)),
  noteCount: (state, getters) => _.size(getters.notes),
  selected: state => state.selected,
  cursor: state => state.cursor,
  beatPulse: (state, getters) => _.reduce(getters.pulsesByBeat, ([beat, pulse, working], pulses) =>
      working && pulse >= pulses ? [beat + 1, pulse - pulses, true] : [beat, pulse],
      [0, state.cursor, true]),
  beatTick: (state, getters) => beatTickFrom(...getters.beatPulse),
  touched: state => state.touched
};

export const mutations = {
  setup(state, {pulseBeat, layout}) {
    state.pulseBeat = pulseBeat;
    state.layout = layout;
    state.selected = null;
    state.cursor = 0;
    state.touched = false;
  },
  setData(state, data = {}) {
    state.data = data;
  },
  reset(state) {
    state.data = {};
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
  update({commit, state, getters}, {pulseBeat, layout, clear}) {
    commit('setup', { pulseBeat, layout });
    commit('setData', clear ? {} : _.mapValues(_.pick(state.data, getters.beatTicks),
          (soundData) => _.pick(soundData, getters.soundIds)));
  },
  move({commit, state, getters}, move) {
    commit('select', {
      cursor: (state.cursor + move + getters.numPulses) % getters.numPulses
    });
  },
  set({commit, state, getters}, {cursor = state.cursor, soundId = state.selected, soundName}) {
    if (state.cursor !== cursor) {
      commit('select', { cursor, soundId });
    }
    commit(soundName ? 'setNote' : 'unsetNote', {
      beatTick: getters.beatTicks[cursor],
      soundId,
      soundName
    });
  },
  unset({commit, state, getters}, soundId) {
    commit('unsetNote', {
      beatTick: getters.beatTicks[state.cursor],
      soundId
    });
  },
  select({commit, state, rootGetters}, {cursor, soundId = state.selected}) {
    if (!rootGetters['keyMode'] && (state.cursor !== cursor || state.selected !== soundId)) {
      commit('select', { cursor, soundId });
    }
  },
  unselect({commit, rootGetters}) {
    if (!rootGetters['keyMode']) {
      commit('unselect');
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
