import Vue from 'vue';
import Combinatorics from 'js-combinatorics';

import GameAnalytics from '~/common/game-analytics';

const TEMPO = 120;
const INCREMENT = 10;

const LAYOUTS = [
  [{ noteByKey: { a: 'kick' } }],
  [{ noteByKey: { q: 'snare', a: 'kick' } }],
  [{ noteByKey: { q: 'snare' } }, { noteByKey: { a: 'kick' } }]
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
  lesson: {
    name: null,
    stages: [],
    index: -1,
    tempo: 0,
    backing: 0
  },
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
    auto: 0,
    backing: 0,
    layout: 0,
    tempo: 0,
    notes: 0
  },
  penalty: {
    backing: 0,
    tempo: 0
  },
  hack: {
    playable: false
  },
  points: [], // [layout][pulseBeat][tempo][backing] = [{base, heavy, light}]
  nextPoints: 0
});

export const getters = {
  lessonName: state => state.lesson.name,
  stageIndex: state => state.lesson.index,
  stageGoal: state => state.lesson.stages[state.lesson.index],
  lessonDone: state => state.lesson.index === state.lesson.stages.length,
  layouts: state => _.take(LAYOUTS, state.power.layout + 1),
  layout: state => LAYOUTS[state.mode.layout],
  layoutNotesMultiple: (state, getters) => getters.layout && getters.layout.length,
  tempos: (state, getters) => _.range(getters.minTempo, getters.maxTempo + INCREMENT, INCREMENT),
  tempo: (state, getters) => TEMPO + INCREMENT * getters.level.tempo,
  minTempo: state => Math.max(60, TEMPO - INCREMENT * state.power.tempo),
  maxTempo: (state, getters) => TEMPO + INCREMENT * (getters.stageGoal ? state.mode.tempo : state.power.tempo),
  backings: state => _.take(BACKINGS, state.power.backing + 1),
  backing: (state, getters) => BACKINGS[getters.level.backing],
  showBacking: (state, getters) => getters.stageGoal ? state.mode.backing : state.power.backing,
  backingVolume: (state, getters) => !getters.stageGoal || state.lesson.backing ? 10 : 0,
  pulseBeats: state => _.concat(_.map(Combinatorics.baseN([1, 2], 4).toArray(),
    _.partial(_.join, _, ''))),
  pulseBeatGroups: (state, getters) => _.mapValues(_.pickBy(_.groupBy(_.map(getters.pulseBeats, splitPulseBeat), _.sum),
      (group, noteCount) => _.toNumber(noteCount) * getters.layoutNotesMultiple <= state.power.notes),
      _.partial(_.map, _, _.partial(_.join, _, ''))),
  power: state => state.power,
  level: (state, getters) => !getters.stageGoal ? state.mode :
      _.mapValues(state.mode, (value, power) =>
          _.isUndefined(state.lesson[power]) ? state.mode[power] : state.lesson[power]),
  weenie: state => state.weenie,
  penalty: (state, getters) => getters.stageGoal ? state.penalty : {},
  hack: state => state.hack,
  next: state => _.mapValues(state.power, (value, power) =>
      !state.power.notes && power !== 'auto' || value === MAX_POWER[power] ? 0 : value + 1),
  autoLevel: state => state.mode.auto,
  showLoop: state => state.power.auto > 1,
  nextPoints: state => state.nextPoints,
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
  highPoints: (state, getters) => _.times(getters.layouts.length, layout => {
    return _.reduce(getters.pulseBeats, (pointsByPulseBeat, pulseBeat) => {
      let fasterPoints = _.times(getters.backings.length, () => []);
      pointsByPulseBeat[pulseBeat] = _.reduceRight(getters.tempos, (pointsByTempo, tempo) => {
        pointsByTempo[tempo] = _.cloneDeep(fasterPoints);
        _.forEachRight(getters.backings, (readBacking, readBackingLevel) => {
          let points = _.get(state.points, [layout, pulseBeat, tempo, readBackingLevel], []);
          _.forEach(getters.backings, (writeBacking, writeBackingLevel) => {
            let bestPoints = pointsByTempo[tempo][writeBackingLevel];
            _.forEach(points, (nextPoints, pointIndex) => {
              let amount = _.assign({ backing: readBacking }, nextPoints);
              if (!bestPoints.length) {
                bestPoints.push(amount);
              } else if (nextPoints.star) {
                if (!pointIndex && !bestPoints[0].star) {
                  // Replacing previous best points with stars, look at all backing
                  let betterPoints = _.find(fasterPoints,
                      bestPoints => bestPoints[0] && bestPoints[0].star);
                  if (betterPoints) {
                    bestPoints = pointsByTempo[tempo][writeBackingLevel] = _.cloneDeep(betterPoints);
                  }
                }
                if (bestPoints[0].star || readBackingLevel === writeBackingLevel) {
                  let insertion = _.sortedLastIndexBy(bestPoints, amount, sortAmount);
                  bestPoints.splice(insertion, bestPoints[0].star ? 0 : 1, amount);
                }
              } else if (!pointIndex && readBackingLevel === writeBackingLevel &&
                  _.every(bestPoints, amount => amount.backing !== writeBacking || !amount.star)) {
                bestPoints.splice(0, 1, amount);
              }
            });
          });
        });
        fasterPoints = pointsByTempo[tempo];
        return pointsByTempo;
      }, {});
      return pointsByPulseBeat;
    }, {});
  }),
  ranking: (state, getters) => base => {
    let newAmount = { backing: getters.backing, tempo: getters.tempo, base, newScore: true };
    let ranking = getters.rankingForDisplay[getters.lessonName];
    let insertion = _.sortedLastIndexBy(ranking, newAmount, sortAmount);
    return _.take(ranking, insertion).concat(newAmount, _.takeRight(ranking, ranking.length - insertion),
        getters.rankingFiltered[getters.lessonName]);
  },
  rankingByLesson: (state, getters) => {
    let ranking = {};
    _.times(getters.layouts.length, layout => {
      _.forEach(getters.pulseBeats, pulseBeat => {
        let pointRank = [];
        _.forEachRight(getters.tempos, tempo => {
          _.forEach(getters.backings, (backing, backingLevel) => {
            let pointsForLevel = _.get(state.points, [layout, pulseBeat, tempo, backingLevel], []);
            _.forEach(pointsForLevel, nextPoints => {
              let amount = _.assign({ backing, tempo }, nextPoints);
              let insertion = _.sortedLastIndexBy(pointRank, amount, sortAmount);
              pointRank.splice(insertion, 0, amount);
            });
          });
        });
        ranking[layout + '-' + pulseBeat] = pointRank;
      });
    });
    return ranking;
  },
  rankingForDisplay: (state, getters) => _.mapValues(getters.rankingByLesson, ranking =>
      _.filter(ranking, amount => amount.tempo >= getters.tempo)),
  rankingFiltered: (state, getters) => _.mapValues(getters.rankingByLesson, ranking =>
      _.filter(ranking, amount => amount.tempo < getters.tempo)),
  pointsByPulseBeat: (state, getters) => _.mapValues(getters.highPoints[state.mode.layout],
      _.property([getters.tempo, state.mode.backing])),
  prerequisite: (state, getters) => _.reduce(getters.pulseBeats, (result, pulseBeat) => {
    let replace = _.find(['4', '3', '2'], value => _.includes(pulseBeat, value));
    if (replace) {
      let replacement = String(_.floor(_.toNumber(replace) / 2));
      result[pulseBeat] = _.compact(_.times(pulseBeat.length, i =>
          pulseBeat.charAt(i) === replace && splice(pulseBeat, i, 1, replacement)));
    }
    return result;
  }, {}),
  playable: (state, getters) => _.mapValues(getters.pointsByPulseBeat, (points, pulseBeat, pointsByPulseBeat) =>
      points.length || !getters.prerequisite[pulseBeat] || !getters.prerequisite[pulseBeat].length ||
          _.some(getters.prerequisite[pulseBeat], pulseBeat => pointsByPulseBeat[pulseBeat].length)),
  displayPoints: (state, getters) => _.mapValues(getters.pointsByPulseBeat, (points, pulseBeat) =>
      state.hack.playable || getters.playable[pulseBeat] ? points : undefined),
  totalStars: (state, getters) => _.reduce(getters.highPoints, (result, pointsByPulseBeat) => {
    _.forEach(pointsByPulseBeat, pointsByTempo => {
      _.forEach(_.filter(pointsByTempo, (value, tempo) => tempo >= TEMPO), pointsByBacking => {
        _.forEach(pointsByBacking, (points, backingIndex) => {
          _.forEach(_.take(points, 3), amount => {
            if (amount.star && BACKINGS[backingIndex] === amount.backing) {
              result += 1;
            }
          })
        });
      });
    });
    return result;
  }, 0),
  groupsWithoutStars: (state, getters) => _.filter(getters.pulseBeatGroups,
      pulseBeatGroup => !_.some(pulseBeatGroup, pulseBeat =>
          _.some(getters.pointsByPulseBeat[pulseBeat], amount => amount.star))),
  rowsWithStars: (state, getters) =>
      _.size(getters.pulseBeatGroups) - getters.groupsWithoutStars.length,
};

export const mutations = {
  resetPower(state, params) {
    state.points = [];
    state.nextPoints = 0;
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
      _.forEach(_.keys(state.weenie), power => {
        state.weenie[power] = power === 'layout' ? -1 : 0;
      });
    } else {
      _.forEach(_.keys(state.mode), power => {
        state.power[power] = state.mode[power] = params[power] || 0;
      });
      state.power.notes = 0;
      if (_.isUndefined(params.layout)) {
        state.mode.layout = -1;
      }
      _.forEach(_.keys(state.weenie), power => {
        state.weenie[power] = 0;
      });
      _.forEach(_.keys(state.hack), hack => {
        state.hack[hack] = false;
      });
    }
  },
  newStage(state, {name, stages = {}, next}) {
    if (next) {
      if (state.lesson.index + 1 <= state.lesson.stages.length) {
        state.lesson.index = state.lesson.index + 1;
      } else {
        console.error('Cannot advance stage any more');
      }
    } else {
      state.lesson.name = name;
      state.lesson.stages = stages;
      state.lesson.index = stages.length ? 0 : -1;
    }
    state.lesson.tempo = state.mode.tempo;
    state.lesson.backing = state.mode.backing;
    _.forEach(state.penalty, (level, penalty) => {
      state.penalty[penalty] = state.mode[penalty]
    });
  },
  nextPower(state, {power, nextPoints, updateMode}) {
    if (!MAX_POWER[power]) {
      console.error('Invalid power', power);
    } else if (state.power[power] < MAX_POWER[power]) {
      state.nextPoints = nextPoints;
      state.power[power]++;
      if (updateMode) {
        state.mode[power]++;
      }
      state.weenie[power] = state.power[power];
      GameAnalytics.power('Next', power, state.power[power]);
    } else {
      console.error('Exceeding max', MAX_POWER[power], 'for', power);
    }
  },
  mode(state, {power, min = 0,
      level = state.mode[power] > min ? state.mode[power] - 1 : state.power[power]}) {
    if (_.isUndefined(state.mode[power])) {
      console.error('Invalid power', power);
    } else if (_.inRange(level, min, state.power[power] + 1)) {
      state.mode[power] = level;
      if (power === 'layout' && state.power.notes < 5) {
        state.power.notes = 4;
        state.weenie.notes = 4;
      }
      if (power === 'auto' || state.power[power] === level) {
        if (state.weenie[power] === level) {
          GameAnalytics.power('Weenie', power, state.weenie[power]);
        }
        state.weenie[power] = power === 'layout' ? -1 : 0;
      }
    } else {
      console.error('Invalid power level', power, level, 'should be in', min, state.power[power]);
    }
  },
  lesson(state, {power, min = 0,
      level = state.lesson[power] > min ? state.lesson[power] - 1 : state.mode[power]}) {
    if (!MAX_POWER[power] || _.isUndefined(state.lesson[power])) {
      console.error('Invalid lesson power:', power);
    } else if (_.inRange(level, min, state.mode[power] + 1)) {
      state.lesson[power] = level;
      if (level < state.penalty[power]) {
        state.penalty[power] = level;
      }
    } else {
      console.error('Invalid lesson power level:', power, level, state.mode[power]);
    }
  },
  weenie(state, {power, level = 0}) {
    if (state.weenie[power]) {
      GameAnalytics.power('Weenie', power, state.weenie[power]);
    }
    state.weenie[power] = level;
  },
  points(state, {pulseBeat, tempo, amount}) {
    if (!amount.base) {
      return;
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
  initialize({commit}, params = {}) {
    commit('resetPower', params);
  },
  setStages({commit}, params = {}) {
    commit('newStage', params);
  },
  nextStage({state, commit}) {
    if (state.lesson.index > -1) {
      commit('newStage', { next: true });
    }
  },
  next({state, getters, commit}, power) {
    commit('nextPower', {
      power,
      nextPoints: getters.totalPoints + 100,
      updateMode: state.mode[power] === state.power[power] && power === 'auto'
    });
  },
  weenie({state, commit}, {power, level}) {
    if (_.isUndefined(state.weenie[power])) {
      console.error('Invalid weenie');
    }
    commit('weenie', {power, level});
  },
  auto({commit}, level) {
    commit('mode', { power: 'auto', level, min: 1});
  },
  backing({getters, commit}, level) {
    commit(getters.stageGoal ? 'lesson' : 'mode', { power: 'backing', level });
  },
  layout({commit}, level) {
    commit('mode', { power: 'layout', level });
  },
  tempo({getters, commit}, tempo) {
    commit(getters.stageGoal ? 'lesson' : 'mode', {
      power: 'tempo',
      level: (tempo - 120) / 10,
      min: -getters.power.tempo
    });
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
  return -amount.base * Math.pow(2, (amount.heavy || 0) + (amount.light || 0)) -
      (amount.tempo || 0) / 1000 - _.indexOf(BACKINGS, amount.backing || 'none') / 10000 +
      (amount.newScore || 0) / 100000;
}
