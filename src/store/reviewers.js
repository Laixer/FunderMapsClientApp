/**
 * Import Dependency
 */
import AttributedUser from 'model/AttributedUser'

/**
 * Import API
 */
import reviewersAPI from 'api/reviewers';

/**
 * Declare Variable
 */
const state = {
  reviewers : null
}

const getters = {
  areReviewersAvailable: state => state.reviewers !== null,
  reviewers: state => state.reviewers,
  getUserById: state => ({ id }) => state.reviewers.find(reviewer => reviewer.id === id)
}
const actions = {
  async getReviewers({ commit }) {
    let response = await reviewersAPI.getReviewers();
    
    if (response.status === 200 && response.data) {
      commit('set_reviewers', { reviewers: response.data })
    }
  },
  clearVersion({ commit }) {
    commit('clear_reviewers')
  }
}
const mutations = {
  set_reviewers(state, { reviewers }) {
    state.reviewers = reviewers.forEach(
      reviewer => new AttributedUser({ user: reviewer, role: 'Reviewer' })
    )
  },
  clear_reviewers(state) {
    state.reviewers = null;
  }
}

/**
 * Export
 */
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
