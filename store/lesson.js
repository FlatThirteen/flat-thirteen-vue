export const state = () => ({
  surfaces: [],
  pulseBeat: '1111',
  stages: [],
  index: -1,
  points: []
});

export const getters = {
  surfaces: state => state.surfaces,
  pulseBeat: state => state.pulseBeat,
  stages: state => state.stages,
  stageGoal: state => state.stages[state.index],
  done: state => state.index === state.stages.length,
  points: state => state.points,
  totalPoints: state => _.sum(state.points)
};

export const mutations = {
  reset(state, {surfaces = state.surfaces, pulseBeat = state.pulseBeat, stages = state.stages} = {}) {
    state.surfaces = surfaces;
    state.pulseBeat = pulseBeat;
    state.stages = stages;
    state.index = stages.length ? 0 : -1;
    state.points = [];
  },
  complete(state, {points}) {
    state.points.push(points);
    if (state.index + 1 <= state.stages.length) {
      state.index = state.index + 1;
    }
  }
};

export const actions = {
  initialize({commit, dispatch, getters}, lesson) {
    commit('reset', lesson);
    dispatch('stage/initialize', {
      autoLevel: lesson.autoLevel,
      goal: getters.stageGoal
    }, { root: true });
  },
  next({commit, dispatch, state, getters}, {points}) {
    if (state.index > -1) {
      commit('complete', { points });
    }
    if (state.index === -1) {
      commit('stage/reset', undefined, { root: true });
    } else if (!getters.done) {
      dispatch('stage/initialize', { goal: getters.stageGoal }, { root: true });
    }
  },
  clear({commit, dispatch}) {
    commit('reset', { surfaces: [], stages: []});
    dispatch('stage/clear', undefined, { root: true });
  }
};
