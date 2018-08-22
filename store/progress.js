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
  layout: LAYOUTS.length - 1,
  auto: 3,
  backing: BACKINGS.length - 1,
  notes: 16,
  tempoUp: 8,
  tempoDown: 2
};

export const state = () => ({
  points: [], // [layoutIndex][pulseBeat][tempo][backingsIndex] = [{base, heavy, light}]
  power: {
    layout: 0,
    auto: 0,
    backing: 0,
    notes: 0,
    tempoUp: 0,
    tempoDown: 0
  }
});

export const getters = {
  layouts: state => _.take(LAYOUTS, state.power.layout + 1),
  minTempo: state => TEMPO - INCREMENT * state.power.tempoDown,
  maxTempo: state => TEMPO + INCREMENT * state.power.tempoUp,
  tempos: (state, getters) => _.range(getters.minTempo, getters.maxTempo + INCREMENT, INCREMENT),
  backings: state => _.take(BACKINGS, state.power.backing + 1),
  pulseBeats: state => _.concat(_.map(Combinatorics.baseN([1, 2], 4).toArray(),
      _.partial(_.join, _, ''))),
  points: state => state.points,
  displayPoints: (state, getters) => _.times(getters.layouts.length, layoutIndex => {
    return _.reduce(getters.pulseBeats, (pointsByPulseBeat, pulseBeat) => {
      let fasterPoints = _.times(getters.backings.length, () => []);
      pointsByPulseBeat[pulseBeat] = _.reduceRight(getters.tempos, (pointsByTempo, tempo) => {
        pointsByTempo[tempo] = fasterPoints;
        _.forEachRight(getters.backings, (backing, backingLevel) => {
          let points = state.points[layoutIndex] && state.points[layoutIndex][pulseBeat] &&
          state.points[layoutIndex][pulseBeat][tempo] &&
          state.points[layoutIndex][pulseBeat][tempo][backingLevel] ?
            state.points[layoutIndex][pulseBeat][tempo][backingLevel] : [];
          _.times(getters.backings.length, i => {
            let displayPoints = pointsByTempo[tempo][i];
            if (displayPoints.length < 3 && points[0] && points[0].base) {
              if (points[0].base < MAX_POINTS) {
                let amount = _.assign({ backing: getters.backings[backingLevel] }, points[0]);
                if (!displayPoints.length) {
                  displayPoints.push(amount);
                } else if (displayPoints[0].base < MAX_POINTS && i === backingLevel) {
                  displayPoints.splice(0, 1, amount);
                }
              } else {
                _.forEach(points, nextPoints => {
                  if (nextPoints.base === MAX_POINTS) {
                    let amount = _.assign({ backing: getters.backings[backingLevel] }, nextPoints);
                    if (displayPoints[0] && displayPoints[0].base < MAX_POINTS) {
                      if (displayPoints[0].backing !== getters.backings[i]) {
                        displayPoints.splice(0, displayPoints === fasterPoints[i] ? 3 : 0, amount);
                      }
                    } else {
                      let insertion = _.sortedLastIndexBy(displayPoints, amount, sortAmount);
                      if (insertion < 3) {
                        displayPoints.splice(insertion, 0, amount);
                        displayPoints.splice(3);
                      }
                    }
                  }
                })
              }
            }
          });
        });
        fasterPoints = _.cloneDeep(pointsByTempo[tempo]);
        return pointsByTempo;
      }, {});
      return pointsByPulseBeat;
    }, {});
  }),
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
  power: state => state.power,
  next: state => _.mapValues(state.power, (value, power) =>
    !state.power.notes ? 0 : value === MAX_POWER[power] ? 0 : value + 1),
  showLoop: state => state.power.auto > 1
};

export const mutations = {
  reset(state, {max, layout, auto, backing, notes, tempoUp, tempoDown}) {
    state.points = [];
    if (max) {
      _.forEach(MAX_POWER, (max, power) => {
        state.power[power] = max;
      });
    } else {
      state.power.layout = layout || 0;
      state.power.auto = auto || 0;
      state.power.backing = backing || 0;
      state.power.notes = notes || 4;
      state.power.tempoUp = tempoUp || 0;
      state.power.tempoDown = tempoDown || 0;
    }
  },
  nextPower(state, power) {
    if (!MAX_POWER[power]) {
      console.error('Invalid power', power);
    } else if (state.power[power] < MAX_POWER[power]) {
      state.power[power]++;
    } else {
      console.error('Exceeding max', MAX_POWER[power], 'for', power);
    }
  },
  addPoints(state, {layoutIndex, pulseBeat, tempo, backingLevel, amount}) {
    if (!amount.base) {
      return;
    }
    if (amount.base > 400) {
      throw new Error('Invalid base points:', amount);
    }
    if (!state.points[layoutIndex]) {
      Vue.set(state.points, layoutIndex, {});
    }
    if (!state.points[layoutIndex][pulseBeat]) {
      Vue.set(state.points[layoutIndex], pulseBeat, {});
    }
    if (!state.points[layoutIndex][pulseBeat][tempo]) {
      Vue.set(state.points[layoutIndex][pulseBeat], tempo, []);
    }
    if (!state.points[layoutIndex][pulseBeat][tempo][backingLevel]) {
      Vue.set(state.points[layoutIndex][pulseBeat][tempo], backingLevel, []);
    }
    let points = state.points[layoutIndex][pulseBeat][tempo][backingLevel];
    let index = _.sortedLastIndexBy(points, amount, sortAmount);
    points.splice(index, 0, amount);
  }
};

export const actions = {
  reset({commit}, params = {}) {
    commit('reset', params);
  },
  next({state, commit, dispatch}, power) {
    commit('nextPower', power);
  }
};

function sortAmount(amount) {
  return -amount.base * Math.pow(2, (amount.heavy || 0) + (amount.light || 0));
}
