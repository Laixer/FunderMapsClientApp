/**
 * Import Dependency
 */
import OrgUserModel from 'model/OrgUser'

/**
 * Import API
 */
import orgUserAPI from 'api/orgUser';

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
      return user.user.id === id
    })
  }
}
const actions = {
  async getUsers({ commit }, { orgId }) {
    let response = await orgUserAPI.getOrganizationUsers({ orgId });
    if (response.status === 200 && response.data.length > 0) {
      commit('set_users', {
        users: response.data
      })
    } 
  },
  async updateUser({ commit }, { orgId, userData }) {
    let response = await orgUserAPI.updateOrganizationUser({ orgId, user: userData })
    commit('update_user', {
      userData
    })
    return response;
  }
}
const mutations = {
  set_users(state, { users }) {
    state.users = users.map(user => {
      return new OrgUserModel(user)
    })
  },
  update_user(state, { userData }) {

    let index = state.users.findIndex(user => {
      return user.user.id === userData.id
    })
    state.users[index].user = userData;

    // TODO: update user locally
    console.log(userData)
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
