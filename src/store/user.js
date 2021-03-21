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
const defaultState = {
  user: null
}

const state = Object.assign({}, defaultState);

const getters = {
  user: state => {
    return state.user;
  },
  isUserAvailable: state => {
    return !!state.user
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
    state.user.givenName = state.user.givenName === '' ? null : state.user.givenName;
    state.user.lastName = state.user.lastName === '' ? null : state.user.lastName;
    state.user.avatar = state.user.avatar === '' ? null : state.user.avatar;
    state.user.jobTitle = state.user.jobTitle === '' ? null : state.user.jobTitle;
    state.user.phoneNumber = state.user.phoneNumber === '' ? null : state.user.phoneNumber;
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
      id: user.id,
      email: user.email,
      givenName: user.givenName,
      lastName: user.lastName,
      avatar: user.avatar,
      jobTitle: user.jobTitle,
      phoneNumber: user.phoneNumber
    });
  },
  clear_user(state) {
    state.user = null
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
