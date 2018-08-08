import Vue from 'vue';

export const state = () => ({
  scene: 'standby',
  nextScene: 'standby',
  preGoal: false,
  changed: false,
  autoLevel: 0,
  autoMax: 0,
  counts: {},
  penalty: {},
  penaltyMax: {},
  penaltyLast: {},
  beatWrong: null
});

export const getters = {
  scene: state => state.scene,
  nextScene: state => state.nextScene,
  isOrNext: state => scene => state.scene === scene || state.nextScene === scene,
  preGoal: state => state.preGoal,
  autoLevels: state => _.times(nextMap.length),
  autoLevel: state => state.autoLevel,
  autoGoal: state => state.autoLevel > 0,
  autoLoop: state => state.autoLevel > 1,
  autoRepeat: state => state.autoLevel > 2,
  autoMax: state => state.autoMax,
  autoNext: state => state.autoMax === nextMap.length - 1 ||
      state.autoLevel !== state.autoMax ? 0 : state.autoMax + 1,
  showLoop: state => state.autoMax > 1,
  goalCount: state => state.counts['goal'],
  playCount: state => state.counts['playback'],
  basePoints: state => 100 - _.sum(_.values(state.penalty)),
  beatWrong: state => state.beatWrong
};

export const mutations = {
  reset(state, {autoLevel = state.autoLevel, autoMax = state.autoMax,
      penaltyMax = state.penaltyMax} = {}) {
    state.scene = 'standby';
    state.nextScene = 'standby';
    state.preGoal = autoLevel === 0 || autoLevel === 1;
    state.autoMax = _.clamp(autoMax, 0, nextMap.length - 1);
    state.autoLevel = _.clamp(autoLevel, -1, state.autoMax);
    state.counts = { goal: 0, playback: 0 };
    state.penalty = {};
    state.penaltyMax = penaltyMax;
    state.penaltyLast = {};
  },
  scene(state, {scene, nextScene = scene === 'standby' ? 'standby' : state.nextScene}) {
    if (state.scene === 'goal') {
      state.preGoal = false;
    }
    state.scene = scene;
    state.nextScene = nextScene;
    state.changed = false;
    if (state.counts[scene] !== undefined) {
      state.counts[scene] = state.counts[scene] + 1;
    }
    state.beatWrong = null;
  },
  next(state, {nextScene}) {
    state.nextScene = nextScene;
  },
  autoAdjust(state, {max} = {}) {
    if (max === 0) {
      state.autoMax = 0;
      state.autoLevel = 0;
    } else {
      if (max) {
        state.autoMax = _.clamp(state.autoMax + 1, 0, nextMap.length - 1);
      }
      state.autoLevel = max || state.autoLevel <= 1 ? state.autoMax : state.autoLevel - 1;
    }
    if (state.nextScene !== 'playback') {
      state.nextScene = getNext(state.autoLevel, state.scene);
    }
  },
  changed(state) {
    state.changed = true;
  },
  penalty(state, {type, amount}) {
    if (amount && state.penaltyMax[type]) {
      let previous = state.penalty[type] || 0;
      let current = Math.min(state.penaltyMax[type], previous + amount);
      Vue.set(state.penaltyLast, type, current - previous);
      Vue.set(state.penalty, type, current);
    }
  },
  beatWrong(state, beatWrong) {
    state.beatWrong = beatWrong;
  }
};

export const actions = {
  clear({commit, dispatch}) {
    commit('reset', { penaltyMax: {} });
    commit('phrase/clear', { name: 'goal' }, { root: true });
    dispatch('transport/stop', undefined, { root: true });
  },
  initialize({commit, dispatch, getters, rootGetters}, {autoMax, autoLevel = autoMax, goal} = {}) {
    let paused = rootGetters['transport/paused'];
    dispatch('phrase/initialize', { goal }, { root: true });
    commit('reset', { autoLevel, autoMax, penaltyMax: { goal: 45, wrong: 50 } });
    if (paused && getters['autoGoal'] && rootGetters['phrase/goalNoteCount']) {
      dispatch('onAction', { scene: 'count' });
    }
  },
  onLoop({commit, getters}) {
    if (getters.showLoop) {
      commit('autoAdjust');
    }
  },
  onPowerUp({commit, dispatch, state, rootGetters}) {
    commit('autoAdjust', { max: true });
    if (state.autoLevel > 0 && rootGetters['transport/paused'] &&
        rootGetters['phrase/goalNoteCount']) {
      dispatch('onAction', { scene: 'count' });
    }
  },
  onAction({commit, dispatch, getters, rootGetters}, {playTime,
      scene = getters.scene !== 'standby' ? 'standby' :
          rootGetters['phrase/goalNoteCount'] ? 'goal' : 'playback'
  } = {}) {
    if (getters.isOrNext(scene)) {
      scene = 'standby';
    }
    let nextScene;
    if (getters.scene !== 'standby' && scene !== 'standby') {
      nextScene = scene;
      scene = getters.scene;
    } else {
      nextScene = getNext(getters.autoLevel, scene);
    }

    commit('scene', {scene, nextScene});
    if (scene === 'standby') {
      dispatch('transport/stop', undefined, { root: true });
    } else {
      if (scene === 'goal' && getters.goalCount > 1) {
        commit('penalty', { type: 'goal', amount: 10 });
      }
      commit('phrase/clear', { name: 'playback' }, { root: true });
      Vue.nextTick(() => {
        dispatch('transport/start', playTime, { root: true });
      });
    }
  },
  autoPlay({commit, dispatch, state, getters, rootGetters}) {
    commit('changed');
    if (rootGetters['phrase/goalNoteCount'] === rootGetters['player/noteCount']) {
      if (state.scene === 'standby') {
        commit('scene', { scene: 'count', nextScene: 'playback' });
        let delay = rootGetters['transport/tempo'] >= 120 ? '+2n' : '+1s';
        dispatch('transport/start', delay, { root: true });
      } else if (state.scene !== 'playback' && state.nextScene !== 'playback') {
        commit('next', { nextScene: 'playback' });
      }
    } else if (getters.autoLoop) {
      if (state.nextScene === 'playback' || getters.autoRepeat && state.scene !== 'playback') {
        commit('next', { nextScene: 'goal'});
      } else if (state.scene !== 'count') {
        commit('next', { nextScene: 'count'});
      }
    } else if (getters.isOrNext('playback') || rootGetters['transport/starting']) {
      commit('scene', { scene: 'standby' });
      dispatch('transport/stop', undefined, { root: true });
    }
  },
  toNext({commit, dispatch, state, getters, rootGetters}) {
    let scene = state.nextScene;
    if (state.scene === 'victory') {
      commit('player/reset', undefined, { root: true });
      dispatch('lesson/next', { points: getters.basePoints }, { root: true });
      if (rootGetters['lesson/done']) {
        scene = 'standby';
      }
    } else if (state.scene === 'goal') {
      if (rootGetters['player/noteCount'] === rootGetters['phrase/goalNoteCount'] &&
          state.changed) {
        scene = 'playback';
      }
    } else if (state.scene === 'playback') {
      if (rootGetters['phrase/equal']('playback', 'goal')) {
        scene = 'victory';
      } else {
        commit('penalty', { type: 'wrong', amount: 10 });
      }
    }
    let nextScene = getNext(state.autoLevel, scene) || scene;
    commit('scene', {scene, nextScene});

    if (scene === 'standby') {
      dispatch('transport/stop', undefined, { root: true });
    } else if (scene === 'count') {
      let delay = rootGetters['transport/tempo'] >= 120 ? '+2n' : '+1s';
      dispatch('transport/start', delay, { root: true });
    } else if (scene === 'playback') {
      commit('phrase/clear', { name: 'playback' }, { root: true });
    } else if (scene === 'victory') {
      dispatch('phrase/setVictory', _.floor(getters.basePoints / 10), { root: true });
    }
  },
  onBeatTick({commit, state, rootGetters}, {time, beat, beatTick}) {
    let goalNotes = rootGetters['phrase/getNotes']('goal', beatTick);
    let playedNotes = rootGetters['player/getNotes'](beatTick);
    if (state.scene === 'playback' || state.scene === 'goal') {
      if (_.xor(_.invokeMap(goalNotes, 'toString'), _.invokeMap(playedNotes, 'toString')).length) {
        commit('beatWrong', beat);
      } else if (state.beatWrong !== null && state.beatWrong !== beat) {
        commit('beatWrong', null);
      }
    }
    switch(state.scene) {
      case 'victory':
        _.forEach(rootGetters['phrase/getNotes']('victory', beatTick), note => {
          note.play(time);
        });
      // fall through
      case 'goal':
        _.forEach(goalNotes, note => {
          note.play(time);
        });
        break;
      case 'playback':
        _.forEach(playedNotes, note => {
          note.play(time);
          if (state.scene === 'playback' && rootGetters['phrase/goalNoteCount']) {
            commit('phrase/add', { name: 'playback', beatTick, note }, { root: true })
          }
        });
    }
  }
};

function getNext(autoLevel, scene) {
  return autoLevel > 0 ? nextMap[autoLevel][scene] || getNext(autoLevel - 1, scene) :
      autoLevel < 0 ? scene : 'standby';
}

const nextMap = [{}, {
  count: 'goal',
  victory: 'count'
}, {
  goal: 'count',
  playback: 'count',
}, {
  goal: 'goal',
}];
