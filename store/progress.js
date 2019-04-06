import Vue from 'vue';
import Combinatorics from 'js-combinatorics';

import { intensityColors, fgIntensity, bgIntensity } from '~/common/colors';
import GameAnalytics from '~/common/game-analytics';

const TEMPO = 120;
const INCREMENT = 10;

const LAYOUTS = [
  [{ noteByKey: { a: 'kick' } }],
  [{ noteByKey: { q: 'snare', a: 'kick' } }],
  [{ noteByKey: { q: 'snare' } }, { noteByKey: { a: 'kick' } }]
];

const MAX_POWER = {
  intensity: intensityColors.length - 1,
  layout: LAYOUTS.length - 1,
  tempo: 8,
  notes: 16
};

function passing(points) {
  return points >= 360;
}

function perfect(points) {
  return points >= 400;
}

export const state = () => ({
  lesson: {
    pulseBeat: null,
    stages: [],
    index: -1,
    tempo: 0,
  },
  power: {
    intensity: 0,
    layout: 0,
    tempo: 0,
    notes: 0
  },
  mode: {
    intensity: 0,
    layout: -1,
    tempo: 0
  },
  weenie: {
    intensity: 0,
    layout: 0,
    tempo: 0,
    notes: 0
  },
  penalty: {
    tempo: 0
  },
  hack: {
    playable: false
  },
  scores: {}, // [layout][pulseBeat] = [{tempo, intensity, base, star, perfect, passing, heavy, light}]
  creep: {}, // [intensity][tempo][layout][pulseBeat] = Number
  frozen: {}, // [intensity][tempo][layout][pulseBeat] = Boolean
  nextPoints: 0,
});

export const getters = {
  lessonName: state => state.lesson.pulseBeat ? state.mode.layout + '-' + state.lesson.pulseBeat : undefined,
  stageIndex: state => state.lesson.index,
  stageGoal: state => state.lesson.stages[state.lesson.index],
  lessonDone: state => state.lesson.index === state.lesson.stages.length,
  fgIntensity: state => fgIntensity(state.mode.intensity),
  bgIntensity: state => bgIntensity(state.mode.intensity),
  backing: state => state.mode.intensity > 2,
  layouts: state => _.take(LAYOUTS, state.power.layout + 1),
  layout: state => LAYOUTS[state.mode.layout],
  layoutNotesMultiple: (state, getters) => getters.layout && getters.layout.length,
  tempos: (state, getters) => _.range(getters.minTempo, getters.maxTempo + INCREMENT, INCREMENT),
  tempo: (state, getters) => TEMPO + INCREMENT * getters.level.tempo,
  minTempo: () => TEMPO,
  maxTempo: state => TEMPO + INCREMENT * (state.lesson.pulseBeat ? state.mode.tempo : state.power.tempo),
  pulseBeats: () => _.concat(_.map(Combinatorics.baseN([1, 2], 4).toArray(), _.partial(_.join, _, ''))),
  pulseBeatGroups: (state, getters) => _.mapValues(_.pickBy(_.groupBy(_.map(getters.pulseBeats, splitPulseBeat), _.sum),
      (group, noteCount) => _.toNumber(noteCount) * getters.layoutNotesMultiple <= state.power.notes),
      _.partial(_.map, _, _.partial(_.join, _, ''))),
  prerequisite: (state, getters) => _.reduce(getters.pulseBeats, (result, pulseBeat) => {
    let replace = _.find(['4', '3', '2'], value => _.includes(pulseBeat, value));
    if (replace) {
      let replacement = String(_.floor(_.toNumber(replace) / 2));
      result[pulseBeat] = _.compact(_.times(pulseBeat.length, i =>
        pulseBeat.charAt(i) === replace && splice(pulseBeat, i, 1, replacement)));
    }
    return result;
  }, {}),
  otherPulseBeats: (state, getters) => _.transform(getters.pulseBeatGroups, (result, group) => {
    _.forEach(group, pulseBeat => {
      result[pulseBeat] = _.without(group, pulseBeat);
    });
    return result;
  }, {}),
  unfreezes: (state, getters) => _.reduce(getters.pulseBeats, (result, pulseBeat) => {
    let others = getters.otherPulseBeats[pulseBeat] || [];
    (result[pulseBeat] || (result[pulseBeat] = [])).unshift(...others);
    _.forEach(getters.prerequisite[pulseBeat], prerequisite => {
      (result[prerequisite] || (result[prerequisite] = [])).push(pulseBeat);
    });
    return result;
  }, {}),
  scaleClass: state => (state.power.notes === 4 ? 'first' :
      state.power.notes === 5 ? 'second' : state.power.notes ? '' : 'initial'),
  power: state => state.power,
  level: (state, getters) => !getters.stageGoal ? state.mode :
      _.mapValues(state.mode, (value, power) =>
          _.isUndefined(state.lesson[power]) ? state.mode[power] : state.lesson[power]),
  weenie: state => state.weenie,
  penalty: (state, getters) => getters.stageGoal ? state.penalty : {},
  hack: state => state.hack,
  next: state => _.mapValues(state.power, (value, power) =>
      !state.power.notes || value === MAX_POWER[power] ? 0 : value + 1),
  nextPoints: state => state.nextPoints,
  totalPoints: state => _.reduce(state.scores, (result, scoresByLayout) => {
    _.forEach(scoresByLayout, scoresByPulseBeat => {
      _.forEach(scoresByPulseBeat, score => {
        result += score.base;
      });
    });
    return result;
  }, 0),
  totalStars: state => _.reduce(state.scores, (result, scoresByLayout) => {
    _.forEach(scoresByLayout, scoresByPulseBeat => {
      result += Math.min(3, _.filter(scoresByPulseBeat, 'star').length);
    });
    return result;
  }, 0),
  modeScores: (state, getters) => _.mapValues(_.invert(getters.pulseBeats), (i, pulseBeat) =>
      _.get(state.scores, [state.mode.layout, pulseBeat], [])),
  newHighScores: (state, getters) => base => {
    let newScore = { base,
      intensity: state.mode.intensity,
      tempo: getters.tempo,
      isNew: true,
      passing: passing(base)
    };
    let ranking = getters.modeScores[state.lesson.pulseBeat];
    let insertion = _.sortedLastIndexBy(ranking, newScore, sortScore);
    return  _.take(ranking, insertion).concat(newScore,
        _.takeRight(ranking, ranking.length - insertion));
  },
  creep: state => _.get(state.creep,
      [state.mode.intensity, state.mode.tempo, state.mode.layout], {}),
  frozen: state => _.get(state.frozen,
      [state.mode.intensity, state.mode.tempo, state.mode.layout], {}),
  freezes: (state, getters) => _.reverse(_.flatMap(_.tail(_.values(getters.pulseBeatGroups)),
      group => _.filter(group, pulseBeat => getters.playable[pulseBeat] &&
          !getters.frozen[pulseBeat]))),
  displayScores: (state, getters) => {
    let scoresByPulseBeat = _.get(state.scores, state.mode.layout, {});
    return _.mapValues(_.invert(getters.pulseBeats), (i, pulseBeat) => {
      let scores = scoresByPulseBeat[pulseBeat];
      if (!scores) {
        return getters.playable[pulseBeat] ? {
          finished: 0,
          creep: getters.creep[pulseBeat],
          frozen: getters.frozen[pulseBeat]
        } : undefined;
      }
      let validScores = _.filter(scores, score =>
        score.intensity === state.mode.intensity && score.tempo === getters.tempo);
      let stars = _.filter(scores, 'star');
      let score = validScores[0] || scores[0];

      return {
        intensity: score.intensity,
        tempo: score.tempo,
        finished: validScores.length,
        stars: _.map(_.take(stars, 3), 'intensity'),
        points: score.star ? undefined : score.base,
        passing: score.passing,
        perfect: score.perfect,
        creep: getters.creep[pulseBeat],
        frozen: getters.frozen[pulseBeat]
      };
    });
  },
  passingFinal: (state, getters) => _.get(getters.displayScores, ['2222', 'passing']),
  playable: (state, getters) => _.mapValues(getters.modeScores, (scores, pulseBeat, modeScores) =>
      state.hack.playable || !!scores.length || !getters.prerequisite[pulseBeat] ||
      !getters.prerequisite[pulseBeat].length ||
      _.some(getters.prerequisite[pulseBeat], pulseBeat => _.filter(modeScores[pulseBeat], 'passing').length)),
  groupsWithoutStars: (state, getters) => _.filter(getters.pulseBeatGroups,
      pulseBeatGroup => !_.some(pulseBeatGroup, pulseBeat =>
          _.some(getters.modeScores[pulseBeat], score => score.star))),
  rowsWithStars: (state, getters) =>
      _.size(getters.pulseBeatGroups) - getters.groupsWithoutStars.length,
  starsCountForIntensity: state => _.flatMap(state.scores, scoresByPulseBeat =>
    _.flatMap(scoresByPulseBeat, scores =>
      _.filter(scores, {
        star: true, intensity: state.mode.intensity
      }))).length,
  threeStarsCount: state => _.flatMap(state.scores, scoresByPulseBeat =>
      _.filter(scoresByPulseBeat, scores =>
          _.filter(scores, { star: true }).length > 2)).length
};

export const mutations = {
  resetPower(state, params) {
    state.scores = {};
    state.creep = {};
    state.frozen = {};
    state.nextPoints = 0;
    if (params.max) {
      _.forEach(MAX_POWER, (max, power) => {
        state.power[power] = max;
      });
      _.forEach(_.keys(state.mode), power => {
        state.mode[power] = 0;
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
  newStage(state, {pulseBeat, stages = {}, next}) {
    if (next) {
      if (state.lesson.index + 1 <= state.lesson.stages.length) {
        state.lesson.index = state.lesson.index + 1;
      } else {
        console.error('Cannot advance stage any more');
      }
    } else {
      state.lesson.pulseBeat = pulseBeat;
      state.lesson.stages = stages;
      state.lesson.index = stages.length ? 0 : -1;
    }
    state.lesson.tempo = state.mode.tempo;
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
        state.mode[power] = state.power[power];
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
      if (state.power[power] === level) {
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
  score(state, {pulseBeat, score, unfreeze, freeze}) {
    score.intensity = state.mode.intensity;
    score.passing = passing(score.base);
    score.perfect = perfect(score.base);
    let intensityCreep = state.creep[state.mode.intensity] ||
        Vue.set(state.creep, state.mode.intensity, {});
    let tempoCreep = intensityCreep[state.mode.tempo] ||
        Vue.set(intensityCreep, state.mode.tempo, {});
    let layoutCreep = tempoCreep[state.mode.layout] ||
        Vue.set(tempoCreep, state.mode.layout, {});
    let intensityFrozen = state.frozen[state.mode.intensity] ||
        Vue.set(state.frozen, state.mode.intensity, {});
    let tempoFrozen = intensityFrozen[state.mode.tempo] ||
        Vue.set(intensityFrozen, state.mode.tempo, {});
    let layoutFrozen = tempoFrozen[state.mode.layout] ||
        Vue.set(tempoFrozen, state.mode.layout, {});
    if (score.passing) {
      if (layoutCreep[pulseBeat]) {
        layoutCreep[pulseBeat] = 0;
      }
      _.forEach(unfreeze, unfreezePulseBeat => {
        if (layoutFrozen[unfreezePulseBeat]) {
          Vue.set(layoutFrozen, unfreezePulseBeat, false);
          return score.star; // Only unfreeze one if not star
        }
      });
    } else {
      let creep = layoutCreep[pulseBeat] || 0;
      Vue.set(layoutCreep, pulseBeat, creep + 1);
      _.forEach(_.take(freeze, creep), freezePulseBeat => {
        Vue.set(layoutFrozen, freezePulseBeat, true);
        console.log('Freezing', freezePulseBeat, 'should uncreep', layoutCreep[freezePulseBeat])
        Vue.set(layoutCreep, freezePulseBeat, 0);
      });
    }
    if (score.base) {
      let layoutScores = state.scores[state.mode.layout] ||
          Vue.set(state.scores, state.mode.layout, {});
      let pulseBeatScores = layoutScores[pulseBeat] ||
          Vue.set(layoutScores, pulseBeat, []);
      let index = _.sortedLastIndexBy(pulseBeatScores, score, sortScore);
      pulseBeatScores.splice(index, 0, score);
    }
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
      updateMode: power === 'intensity' || power === 'tempo'
    });
  },
  weenie({state, commit}, {power, level}) {
    if (_.isUndefined(state.weenie[power])) {
      console.error('Invalid weenie');
    }
    commit('weenie', {power, level});
  },
  intensity({commit}, level) {
    commit('mode', { power: 'intensity', level });
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
  addScore({getters, commit}, {pulseBeat, score}) {
    commit('score', { pulseBeat,
      score: _.set(score, 'tempo', getters.tempo),
      unfreeze: getters.unfreezes[pulseBeat],
      freeze: getters.freezes
    });
  }
};

function splitPulseBeat(pulseBeat) {
  return _.map(_.split(pulseBeat, ''), _.toNumber);
}

function splice(string, startIndex, length, insertString) {
  return string.substring(0, startIndex) + insertString + string.substring(startIndex + length);
}

function sortScore(score) {
  return -score.base * Math.pow(2, (score.heavy || 0) + (score.light || 0)) -
      (score.intensity || 0) / 10 - score.tempo / 10000 + (score.isNew || 0) / 100000;
}
