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
  users : null
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
   * Get all users for a given organization id. The logged in
   * user must be admin to be able to call this function.
   */
  async adminGetUsers({ commit }, { organizationId }) {
    let response = await orgUserAPI.adminGetOrganizationUsers({ organizationId });
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
   * Admin call which updates a given organization user.
   */
  async adminUpdateUser({ dispatch }, { organizationId, userId, data }) {
    let response = await orgUserAPI.adminUpdateOrganizationUser({ organizationId, userId, data })
    if (response.status === 204) {
      dispatch('adminGetUsers', { organizationId });
    }
    return response;
  },

    /**
   * Updates an organization user role, then triggers the getUsers
   * action to fetch the updated user. The result is then returned.
   */
  async updateUserRole({ dispatch }, { userId, role }) {
    let response = await orgUserAPI.updateOrganizationUserRole({ userId, role })
    if (response.status === 204) {
      dispatch('getUsers');
    }
    return response;
  },

  /**
   * Admin call which updates a given organization user role.
   */
  async adminUpdateUserRole({ dispatch }, { organizationId, userId, role }) {
    let response = await orgUserAPI.adminUpdateOrganizationUserRole({ organizationId, userId, role })
    if (response.status === 204) {
      dispatch('adminGetUsers', { organizationId });
    }
    return response;
  },

  /**
   * Creates a new organization user, then triggers the getUsers
   * action to fetch the created user. The result is then returned.
   */
  async createUser({ dispatch }, { data }) {
    let response = await orgUserAPI.createOrganizationUser({ data })
    if (response.status === 200) {
      dispatch('getUsers');
    }
    return response;
  },

  /**
   * Admin call to create a user for any organization.
   */
  async adminCreateUser({ dispatch }, { organizationId, data }) {
    let response = await orgUserAPI.adminCreateOrganizationUser({ organizationId, data })
    if (response.status === 200) {
      dispatch('adminGetUsers', { organizationId });
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

  /**
   * Admin call that removes any user from any organization.
   */
  async adminRemoveUser({ commit }, { organizationId, userId }) {
    let response = await orgUserAPI.adminRemoveOrganizationUser({ organizationId, userId })
    if (response.status === 204) {
      commit('remove_user', { userId })
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
