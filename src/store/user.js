/**
 * Import Dependency
 */
import UserModel from 'model/User'

/**
 * Import API
 */
import userAPI from 'api/user';

/**
 * Declare Variable
 */
const state = {
  user : null
}

const getters = {
  user: state => {
    return state.user;
  },
  isUserAvailable: state => {
    return state.user !== null
  }
}
const actions = {
  async getUser({ commit }) {
    let response = await userAPI.getUser();
    if (response.status === 200 && response.data) {
      commit('set_user', {
        user: response.data
      })
    }
  },
  async updateUser({ state }) {
    return await userAPI.updateUser(state.user)
  },
  // TODO: This is not the way to save the users password
  // eslint-disable-next-line
  async updateUserPassword({ state }, { password, password_new }) {
    return await userAPI.updateUserPassword({ oldPassword: password, newPassword: password_new })
  },
  clearUser({ commit }) {
    commit('clear_user')
  }
}
const mutations = {
  set_user(state, { user }) {
    state.user = new UserModel({
      givenName: user.givenName, 
      lastName: user.lastName, 
      avatar: user.avatar, 
      jobTitle: user.jobTitle, 
      phoneNumber: user.phoneNumber
    });
  },
  clear_user(state) {
    state.user = null
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
