import Vue from 'vue';
import Combinatorics from 'js-combinatorics';

export const MAX_POINTS = 400;

const TEMPO = 120;
const INCREMENT = 10;

const LAYOUTS = [
  [{ soundByKey: { a: 'kick' } }],
  [{ soundByKey: { q: 'snare', a: 'kick' } }],
  [{ soundByKey: { q: 'snare' } }, { soundByKey: { a: 'kick' } }]
];

const BACKINGS = ['none', 'bass'];

const MAX_POWER = {
  auto: 3,
  backing: BACKINGS.length - 1,
  layout: LAYOUTS.length - 1,
  tempo: 8,
  notes: 16
};

export const state = () => ({
  power: {
    auto: 0,
    backing: 0,
    layout: 0,
    tempo: 0,
    notes: 0
  },
  mode: {
    auto: 0,
    backing: 0,
    layout: -1,
    tempo: 0
  },
  weenie: {
    backing: 0,
    layout: -1,
    tempo: 0,
    notes: 0
  },
  hack: {
    playable: false
  },
  points: [], // [layout][pulseBeat][tempo][backing] = [{base, heavy, light}]
});

export const getters = {
  layouts: state => _.take(LAYOUTS, state.power.layout + 1),
  layout: state => LAYOUTS[state.mode.layout],
  layoutNotesMultiple: (state, getters) => getters.layout && getters.layout.length,
  tempos: (state, getters) => _.range(getters.minTempo, getters.maxTempo + INCREMENT, INCREMENT),
  tempo: state => TEMPO + INCREMENT * state.mode.tempo,
  minTempo: state => Math.max(60, TEMPO - INCREMENT * state.power.tempo),
  maxTempo: state => TEMPO + INCREMENT * state.power.tempo,
  backings: state => _.take(BACKINGS, state.power.backing + 1),
  pulseBeats: state => _.concat(_.map(Combinatorics.baseN([1, 2], 4).toArray(),
    _.partial(_.join, _, ''))),
  pulseBeatGroups: (state, getters) => _.mapValues(_.pickBy(_.groupBy(_.map(getters.pulseBeats, splitPulseBeat), _.sum),
      (group, noteCount) => _.toNumber(noteCount) * getters.layoutNotesMultiple <= state.power.notes),
      _.partial(_.map, _, _.partial(_.join, _, ''))),
  power: state => state.power,
  mode: state => state.mode,
  weenie: state => state.weenie,
  hack: state => state.hack,
  minPower: state => _.map(_.keys(state.mode),
      power => power === 'tempo' ? -state.power.tempo : 0),
  next: state => _.mapValues(state.power, (value, power) =>
      !state.power.notes && power !== 'auto' ? 0 : value === MAX_POWER[power] ? 0 : value + 1),
  autoLevel: state => state.mode.auto,
  showLoop: state => state.power.auto > 1,
  points: state => state.points,
  totalPoints: state => _.reduce(state.points, (result, pointsByLayout) => {
    _.forEach(pointsByLayout, pointsByPulseBeat => {
      _.forEach(pointsByPulseBeat, pointsByTempo => {
        _.forEach(pointsByTempo, pointsList => {
          _.forEach(pointsList, points => {
            result += points.base;
          });
        });
      });
    });
    return result;
  }, 0),
  displayPoints: (state, getters) => _.times(getters.layouts.length, layout => {
    return _.reduce(getters.pulseBeats, (pointsByPulseBeat, pulseBeat) => {
      let fasterPoints = _.times(getters.backings.length, () => []);
      pointsByPulseBeat[pulseBeat] = _.reduceRight(getters.tempos, (pointsByTempo, tempo) => {
        _.forEachRight(getters.backings, (backing, backingLevel) => {
          let points = _.get(state.points, [layout, pulseBeat, tempo, backingLevel], []);
          let bestPoints = fasterPoints[backingLevel];
          _.forEach(points, (nextPoints, i) => {
            let amount = _.assign({ backing }, nextPoints);
            if (!bestPoints.length) {
              bestPoints.push(amount);
            } else if (nextPoints.base === MAX_POINTS) {
              if (bestPoints[0].base === MAX_POINTS || backingLevel === state.mode.backing) {
                let insertion = _.sortedLastIndexBy(bestPoints, amount, sortAmount);
                if (insertion < 3) {
                  bestPoints.splice(insertion, bestPoints[0].base < MAX_POINTS ? 1 : 0, amount);
                  bestPoints.splice(3);
                }
              }
            } else if (!i && backingLevel === state.mode.backing &&
              !(bestPoints[0].base === MAX_POINTS && bestPoints[0].backing === backing)) {
              bestPoints.splice(0, 1, amount);
            }
          });
        });
        pointsByTempo[tempo] = _.cloneDeep(fasterPoints);
        return pointsByTempo;
      }, {});
      return pointsByPulseBeat;
    }, {});
  }),
  pointsByPulseBeat: (state, getters) => _.mapValues(getters.displayPoints[state.mode.layout],
      _.property([getters.tempo, state.mode.backing])),
  playable: (state, getters) => _.mapValues(getters.pointsByPulseBeat, (points, pulseBeat, pointsByPulseBeat) => {
    if (points.length) {
      return true;
    }
    let check = _.compact(_.times(pulseBeat.length, i =>
        pulseBeat.charAt(i) === '2' && splice(pulseBeat, i, 1, '1')));
    return !check.length || _.some(check,
        pulseBeat => pointsByPulseBeat[pulseBeat].length);
  }),
  totalStars: (state, getters) => _.reduce(getters.displayPoints, (result, pointsByPulseBeat) => {
    _.forEach(pointsByPulseBeat, pointsByTempo => {
      _.forEach(_.filter(pointsByTempo, (value, tempo) => tempo >= TEMPO), pointsByBacking => {
        _.forEach(pointsByBacking, (points, backingIndex) => {
          _.forEach(points, amount => {
            if (amount.base === MAX_POINTS && BACKINGS[backingIndex] === amount.backing) {
              result += 1;
            }
          })
        });
      });
    });
    return result;
  }, 0),
  rowsWithStars: (state, getters) => _.reduce(getters.pulseBeatGroups, (total, pulseBeatGroup) =>
      total + (_.some(pulseBeatGroup, pulseBeat =>
          _.get(getters.pointsByPulseBeat, [pulseBeat, 0, 'base']) === MAX_POINTS) ? 1 : 0), 0),
};

export const mutations = {
  reset(state, params) {
    state.points = [];
    if (params.max) {
      _.forEach(MAX_POWER, (max, power) => {
        state.power[power] = max;
      });
      _.forEach(_.keys(state.mode), power => {
        state.mode[power] = power === 'auto' ? MAX_POWER[power] : 0;
      });
      _.forEach(_.keys(state.hack), hack => {
        state.hack[hack] = true;
      });
    } else {
      _.forEach(_.keys(state.mode), power => {
        state.power[power] = state.mode[power] = params[power] || 0;
      });
      state.power.notes = 0;
      if (_.isUndefined(params.layout)) {
        state.mode.layout = -1;
      }
    }
  },
  next(state, {power, updateMode}) {
    if (!MAX_POWER[power]) {
      console.error('Invalid power', power);
    } else if (state.power[power] < MAX_POWER[power]) {
      state.power[power]++;
      if (updateMode) {
        state.mode[power]++;
      } else {
        state.weenie[power] = state.power[power];
      }
    } else {
      console.error('Exceeding max', MAX_POWER[power], 'for', power);
    }
  },
  mode(state, {power, level}) {
    state.mode[power] = level;
    if (power === 'layout' && state.power.notes < 5) {
      state.power.notes = 4;
      state.weenie.notes = 4;
    }
    if (state.power[power] === level) {
      state.weenie[power] = power === 'layout' ? -1 : 0;
    }
  },
  weenie(state, {power, level = 0}) {
    state.weenie[power] = level;
  },
  points(state, {pulseBeat, tempo, amount}) {
    if (!amount.base) {
      return;
    }
    if (amount.base > 400) {
      throw new Error('Invalid base points:', amount);
    }
    let layoutPoints = state.points[state.mode.layout] ||
        Vue.set(state.points, state.mode.layout, {});
    let pulseBeatPoints = layoutPoints[pulseBeat] ||
        Vue.set(layoutPoints, pulseBeat, {});
    let tempoPoints = pulseBeatPoints[tempo] ||
        Vue.set(pulseBeatPoints, tempo, []);
    let points = tempoPoints[state.mode.backing] ||
        Vue.set(tempoPoints, state.mode.backing, []);
    let index = _.sortedLastIndexBy(points, amount, sortAmount);
    points.splice(index, 0, amount);
  }
};

export const actions = {
  reset({commit}, params = {}) {
    commit('reset', params);
  },
  next({state, commit}, power) {
    commit('next', {
      power,
      updateMode: state.mode[power] === state.power[power] && power === 'auto'
    });
  },
  mode({state, getters, commit}, {power, min = 0,
      level = state.mode[power] > min ? state.mode[power] - 1 : state.power[power]}) {
    if (_.isUndefined(state.mode[power])) {
      console.error('Invalid power', power);
    } else {
      commit('mode', { power,
        level: _.clamp(level, getters.minPower[power], state.power[power])
      });
    }
  },
  weenie({state, commit}, {power, level}) {
    if (_.isUndefined(state.weenie[power])) {
      console.error('Invalid weenie');
    }
    commit('weenie', {power, level});
  },
  tempo({dispatch}, tempo) {
    dispatch('mode', { power: 'tempo', level: (tempo - 120) / 10 });
  },
  addPoints({getters, commit}, {pulseBeat, amount}) {
    commit('points', {pulseBeat, amount, tempo: getters.tempo});
  }
};

function splitPulseBeat(pulseBeat) {
  return _.map(_.split(pulseBeat, ''), _.toNumber);
}

function splice(string, startIndex, length, insertString) {
  return string.substring(0, startIndex) + insertString + string.substring(startIndex + length);
}

function sortAmount(amount) {
  return -amount.base * Math.pow(2, (amount.heavy || 0) + (amount.light || 0));
}
