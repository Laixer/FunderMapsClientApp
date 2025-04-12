/**
 * Import Dependency
 */
import OrgUserModel from 'model/OrgUser'
import Vue from 'vue'

/**
 * Import API
 */
import orgUserAPI from 'api/orgUser'

/**
 * Declare Variable
 */
const defaultState = {
  users: []
}

const state = Object.assign({}, defaultState);

const getters = {
  orgUsers: state => {
    return state.users;
  },
  areOrganisationUsersAvailable: state => {
    return state.users !== null
  },
  getReviewers: state => {
    return state.users
      ? state.users.filter(user => {
        return user.canReview()
      })
      : null;
  },
  getCreators: state => {
    return state.users
      ? state.users.filter(user => {
        return user.canCreate()
      })
      : null;
  },
  getUserById: (state) => ({ id }) => {
    return state.users.find(user => {
      return user.id === id
    })
  },
  getUserByEmail: (state) => ({ email }) => {
    return state.users.find(user => {
      return user.email === email
    })
  }
}

const actions = {
  /**
   * Gets all current organization users.
   */
  async getUsers({ commit }) {
    let response = await orgUserAPI.getOrganizationUsers();
    if (response.status === 200) {
      commit('set_users', {
        users: response.data
      })
    }
  },
  
  /**
   * This calls getUsers() if we can't find the requested
   * user id in our store. If we can find it, nothing will happen.
   */
  async getOrgUsersIfNotStored({ getters, dispatch }, { userId }) {
    if (!getters.getUserById({ id: userId })) {
      dispatch('getUsers');
    }
  },
  
  /**
   * Clears all currently stored users from the state.
   */
  clearUsers({ commit }) {
    commit('clear_users')
  }
}

const mutations = {
  set_users(state, { users }) {
    state.users = users.map(user => {
      return new OrgUserModel(user)
    })
  },
  clear_users(state) {
    state.users = null
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
