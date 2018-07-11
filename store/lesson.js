export const state = () => ({
  stages: [],
  index: -1,
  points: []
});

export const getters = {
  stages: state => state.stages,
  stage: state => state.index,
  stageGoal: state => state.stages[state.index],
  done: state => state.index === state.stages.length,
  points: state => state.points,
  totalPoints: state => _.floor(_.mean(state.points))
};

export const mutations = {
  reset(state, stages = state.stages) {
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
  initialize({commit, dispatch, getters}, {stages = [], autoMax = 0, autoLevel = autoMax} = {}) {
    commit('reset', stages);
    dispatch('stage/initialize', { autoLevel, autoMax, goal: getters.stageGoal }, { root: true });
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
