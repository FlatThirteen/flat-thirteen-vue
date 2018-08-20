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
  totalPoints: state => _.sum(state.points)
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
  initialize({commit}, {stages = []} = {}) {
    commit('reset', stages);
  },
  next({commit, state}, {points}) {
    if (state.index > -1) {
      commit('complete', { points });
    }
  },
  clear({commit}) {
    commit('reset', { stages: [] });
  }
};
