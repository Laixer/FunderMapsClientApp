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
const state = {
  users : null
}

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
  getUserById: (state) => ({id}) => {
    return state.users.find(user => {
      return user.id === id
    })
  },
  getUserByEmail: (state) => ({email}) => {
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
   * Updates an organization user, then triggers the getUsers
   * action to fetch the updated user. The result is then returned.
   */
  async updateUser({ dispatch }, { userId, data }) {
    let response = await orgUserAPI.updateOrganizationUser({ userId, data })
    if (response.status === 204) {
      dispatch('getUsers');
    }
    return response;
  },
  /**
   * Creates a new organization user, then triggers the getUsers
   * action to fetch the created user. The result is then returned.
   */
  async createUser({ dispatch }, { data }) {
    let response = await orgUserAPI.createOrganizationUser({ data })
    if (response.status === 204) {
      dispatch('getUsers');
    }
    return response;
  },
  /**
   * Removes an organization user.
   */
  async removeUser({ commit }, { userId }) {
    let response = await orgUserAPI.removeOrganizationUser({ userId })
    if (response.status === 204) {
      commit('remove_user', { userId })
    }
  },
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
  // TODO This isn't used
  // update_user(state, { user }) {
  //   let index = state.users.findIndex(u => {
  //     return u.id === user.id
  //   })
  //   state.users[index] = user;
  // },
  remove_user(state, { userId }) {
    let index = state.users.findIndex(user => {
      return user.id === userId
    })
    Vue.delete(state.users, index);
  },
  clear_users(state) {
    state.users = null
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
