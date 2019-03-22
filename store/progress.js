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
  scores: {}, // [tempo][layout][pulseBeat] = [{intensity, base, star, perfect, passing, heavy, light}]
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
  totalPoints: state => _.reduce(state.scores, (result, scoresByTempo) => {
    _.forEach(scoresByTempo, scoresByLayout => {
      _.forEach(scoresByLayout, scoresByPulseBeat => {
        _.forEach(scoresByPulseBeat, score => {
          result += score.base;
        });
      });
    });
    return result;
  }, 0),
  totalStars: state => _.reduce(state.scores, (result, scoresByTempo) => {
    _.forEach(scoresByTempo, scoresByLayout => {
      _.forEach(scoresByLayout, scoresByPulseBeat => {
        result += Math.min(3, _.filter(scoresByPulseBeat, 'star').length);
      });
    });
    return result;
  }, 0),
  modeScores: (state, getters) => _.mapValues(_.invert(getters.pulseBeats), (i, pulseBeat) =>
      _.get(state.scores, [getters.tempo, state.mode.layout, pulseBeat], [])),
  newHighScores: (state, getters) => base => {
    let newScore = { intensity: state.mode.intensity, base, isNew: true, passing: passing(base) };
    let ranking = getters.modeScores[state.lesson.pulseBeat];
    let insertion = _.sortedLastIndexBy(ranking, newScore, sortScore);
    let highScores = _.take(ranking, insertion).concat(newScore,
        _.takeRight(ranking, ranking.length - insertion));
    return _.map(highScores, score => _.defaults({ intensity: bgIntensity(score.intensity) }, score));
  },
  displayScores: (state, getters) => {
    let scoresByPulseBeat = _.get(state.scores, [getters.tempo, state.mode.layout], {});
    return _.mapValues(_.invert(getters.pulseBeats), (i, pulseBeat) => {
      let scores = scoresByPulseBeat[pulseBeat];
      if (!scores) {
        return state.hack.playable || getters.playable[pulseBeat] ? { finished: 0 } : undefined;
      }
      let validScores = _.filter(scores, score => score.intensity === state.mode.intensity);
      let stars = _.filter(scores, 'star');
      let score = validScores[0] || scores[0];

      return {
        intensity: fgIntensity(score.intensity),
        finished: validScores.length || 1,
        stars: _.map(_.take(stars, 3), 'intensity'),
        points: score.star ? undefined : score.base,
        passing: score.passing,
        perfect: score.perfect,
      };
    });
  },
  playable: (state, getters) => _.mapValues(getters.modeScores, (scores, pulseBeat, modeScores) =>
      !!scores.length || !getters.prerequisite[pulseBeat] || !getters.prerequisite[pulseBeat].length ||
          _.some(getters.prerequisite[pulseBeat], pulseBeat => _.filter(modeScores[pulseBeat], 'passing').length)),
  groupsWithoutStars: (state, getters) => _.filter(getters.pulseBeatGroups,
      pulseBeatGroup => !_.some(pulseBeatGroup, pulseBeat =>
          _.some(getters.modeScores[pulseBeat], score => score.star))),
  rowsWithStars: (state, getters) =>
      _.size(getters.pulseBeatGroups) - getters.groupsWithoutStars.length,
  starsCountForIntensity: state => _.flatMap(state.scores, scoresByLayout =>
    _.flatMap(scoresByLayout, scoresByPulseBeat =>
      _.flatMap(scoresByPulseBeat, scores => _.filter(scores, {
        star: true, intensity: state.mode.intensity
      })))).length
};

export const mutations = {
  resetPower(state, params) {
    state.scores = {};
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
  score(state, {tempo, pulseBeat, score}) {
    if (!score.base) {
      return;
    }
    score.intensity = state.mode.intensity;
    score.passing = passing(score.base);
    score.perfect = perfect(score.base);
    let tempoScores = state.scores[tempo] ||
      Vue.set(state.scores, tempo, []);
    let layoutScores = tempoScores[state.mode.layout] ||
        Vue.set(tempoScores, state.mode.layout, {});
    let pulseBeatScores = layoutScores[pulseBeat] ||
        Vue.set(layoutScores, pulseBeat, []);
    let index = _.sortedLastIndexBy(pulseBeatScores, score, sortScore);
    pulseBeatScores.splice(index, 0, score);
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
      updateMode: state.mode[power] === state.power[power] && power === 'intensity'
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
    commit('score', {pulseBeat, score, tempo: getters.tempo});
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
      (score.intensity || 0) / 10 + (score.isNew || 0) / 100;
}
