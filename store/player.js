import Vue from 'vue';

import BeatTick from '~/common/core/beat-tick.model';
import Note from '~/common/core/note.model'

export const state = () => ({
  pulseBeat: '', // '1234,4321'
  layout: [], // [{ noteByKey: { q: 'snare', a: 'kick' } }]
  data: {}, // data[beatTick][surfaceId] = noteString
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
  numBeats: (state, getters) => getters.pulsesByBeat.length,
  numPulses: (state, getters) => _.sum(getters.pulsesByBeat),
  cursorsByBeat: (state, getters) => _.reduce(getters.pulsesByBeat, ({result, offset}, pulses) => ({
    result: _.concat(result, [_.times(pulses, (i) => offset + i)]),
    offset: offset + pulses
  }), { result: [], offset: 0 }).result,
  beatTicks: (state, getters) => beatTicksFrom(getters.pulsesByBeat),
  layout: state => state.layout,
  noteByKey: state => _.map(state.layout, 'noteByKey'),
  surfaceIds: (state, getters) => _.map(getters.noteByKey, (noteByKey) => _.join(_.keys(noteByKey))),
  availableNotes: (state, getters) => _.flatMap(getters.noteByKey, _.values),
  dataBySurfaceCursor: (state, getters) => _.zipObject(getters.surfaceIds,
      _.map(getters.surfaceIds, surfaceId =>
          _.map(getters.beatTicks, beatTick => (state.data[beatTick] || {})[surfaceId]))),
  getNotes: state => beatTick => _.map(_.values(state.data[beatTick]),
      note => Note.from(note)),
  notesByBeat: (state, getters) => _.map(getters.pulsesByBeat, (pulses, beat) => _.times(pulses,
      pulse => _.values(state.data[BeatTick.from(beat, pulse, pulses)]).sort().join('.')).join(',')),
  noteCount: (state, getters) => _.size(_.flatten(_.map(_.values(state.data), _.values)),),
  selected: state => state.selected,
  cursor: state => state.cursor,
  cursorBeatPulse: (state, getters) => _.reduce(getters.pulsesByBeat, ([beat, pulse, working], pulses) =>
      working && pulse >= pulses ? [beat + 1, pulse - pulses, true] : [beat, pulse],
      [0, state.cursor, true]),
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
  setNote(state, {beatTick, surfaceId, note}) {
    if (!state.data[beatTick]) {
      Vue.set(state.data, beatTick, _.fromPairs([[surfaceId, note]]));
    } else {
      Vue.set(state.data[beatTick], surfaceId, note);
    }
    state.selected = surfaceId;
    state.touched = true;
  },
  unsetNote(state, {beatTick, surfaceId}) {
    _.forEach(_.isArray(surfaceId) ? surfaceId : [surfaceId], surfaceId => {
      if (state.data[beatTick]) {
        Vue.delete(state.data[beatTick], surfaceId);
      }
    });
    state.touched = true;
  },
  select(state, {cursor, surfaceId = state.selected}) {
    state.selected = surfaceId;
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
          (soundData) => _.pick(soundData, getters.surfaceIds)));
  },
  move({commit, state, getters}, move) {
    commit('select', {
      cursor: (state.cursor + move + getters.numPulses) % getters.numPulses
    });
  },
  set({commit, state, getters}, {cursor = state.cursor, surfaceId = state.selected, note}) {
    if (state.cursor !== cursor) {
      commit('select', { cursor, surfaceId });
    }
    commit(note ? 'setNote' : 'unsetNote', {
      beatTick: getters.beatTicks[cursor],
      surfaceId,
      note
    });
  },
  unset({commit, state, getters}, surfaceId) {
    commit('unsetNote', {
      beatTick: getters.beatTicks[state.cursor],
      surfaceId
    });
  },
  select({commit, state, rootGetters}, {cursor, surfaceId = state.selected}) {
    if (!rootGetters['keyMode'] && (state.cursor !== cursor || state.selected !== surfaceId)) {
      commit('select', { cursor, surfaceId });
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
      return BeatTick.from(beat, pulse, pulses);
    }));
  }, []);
}
