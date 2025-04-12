/**
 * Import Dependency
 */
import AttributedUser from 'model/AttributedUser'
import AttributedOrganisation from 'model/AttributedOrganisation'

/**
 * Import API
 */
import attestationAPI from 'api/attestation';

/**
 * Declare Variable
 */
const defaultState = {
  users: null,
  contractors: null
}

const state = Object.assign({}, defaultState);

const getters = {
  principalUsers: state => {
    return state.users
  },
  arePrincipalUsersAvailable: state => {
    return state.users !== null // state //
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
  },
  contractors: state => {
    return state.contractors
  },
  areContractorsAvailable: state => {
    return state.contractors !== null
  }
}
const actions = {
  async getPrincipalUsers({ commit }) {
    let response = await attestationAPI.getPrincipalUsers();
    if (response.status === 200 && response.data.length > 0) {
      commit('set_principal_users', {
        users: response.data
      })
    }
  },
  async getContractors({ commit }) {
    let response = await attestationAPI.getOrganizations();
    if (response.status === 200 && response.data.length > 0) {
      commit('set_contractors', {
        contractors: response.data
      })
    }
  }
}
const mutations = {
  set_principal_users(state, { users }) {
    state.users = users.map(user => new AttributedUser({
      user: user, role: 'none'
    }));
  },
  set_contractors(state, { contractors }) {
    state.contractors = contractors.map(org => new AttributedOrganisation(org.id, org.role, org.name));
  },
  // Removed unused clear_principal_users mutation
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
