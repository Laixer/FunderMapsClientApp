/**
 * Import Dependency
 */
import AttributedUser from 'model/AttributedUser'

/**
 * Import API
 */
import reviewersAPI from 'api/reviewers';

import { isSuperUser, isWriter } from '../services/auth'

const defaultState = {
    /**
   * Contains all reviewers. This will exclude the current
   * user if the user has reviewing privileges.
   */
     validReviewers : [],

     /**
      * Contains all reviewers for this users organization.
      */
     reviewers: [],
}

/**
 * Declare Variable
 */
const state = Object.assign({}, defaultState);

const getters = {
  areReviewersAvailable: state => state.validReviewers ? state.validReviewers.length > 0 : false,
  validReviewers: state => state.validReviewers,
  reviewers: state => state.reviewers,
  getUserById: state => ({ id }) => (state.reviewers)
    ? state.reviewers.find(reviewer => reviewer.id === id)
    : null
}

const actions = {
  /**
   * Gets all reviewers for our current organization from the
   * API. This also filters out the current user if he or she
   * has reviewing privileges. This result is stored to the
   * validReviewers field.
   */
  async getReviewers({ commit, rootState }) {
    if (isSuperUser() || isWriter()) {
      let response = await reviewersAPI.getReviewers();

      if (response.status === 200 && response.data) {
        commit('set_reviewers', { reviewers: response.data })

        let filteredData = response.data.filter(r => r.id !== rootState.user.user.id);
        commit('set_valid_reviewers', { reviewers: filteredData })
      }
    }
  },

  /**
   * This calls getReviewers() if we can't find the requested
   * user id in our store. If we can find it, nothing will happen.
   */
  async getReviewersIfNotStored({ getters, dispatch }, { userId }) {
    if (!getters.getUserById({ id: userId })) {
      dispatch('getReviewers');
    }
  },

  clearVersion({ commit }) {
    commit('clear_reviewers')
  }
}
const mutations = {
  /**
   * Writes the fetched reviewers to the store.
   */
  set_reviewers(state , { reviewers }) {
    state.reviewers = reviewers.map(
      reviewer => new AttributedUser({ user: reviewer, role: 'Reviewer' })
    )
  },
    /**
   * Writes the fetched reviewers to the store. No filters
   * are applied by this function.
   */
  set_valid_reviewers(state , { reviewers }) {
    state.validReviewers = reviewers.map(
      reviewer => new AttributedUser({ user: reviewer, role: 'Reviewer' })
    )
  },
  clear_reviewers(state) {
    state.reviewers = null;
  },
  reset(state) {
    Object.assign(state, defaultState);
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
