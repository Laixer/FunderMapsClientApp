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
    state.user.given_name = state.user.given_name === '' ? null : state.user.given_name;
    state.user.family_name = state.user.family_name === '' ? null : state.user.family_name;
    state.user.picture = state.user.picture === '' ? null : state.user.picture;
    state.user.job_title = state.user.job_title === '' ? null : state.user.job_title;
    state.user.phone_number = state.user.phone_number === '' ? null : state.user.phone_number;
    return await userAPI.updateUser(state.user)
  },
  clearUser({ commit }) {
    commit('clear_user')
  }
}
const mutations = {
  set_user(state, { user }) {
    state.user = new UserModel(user);
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
