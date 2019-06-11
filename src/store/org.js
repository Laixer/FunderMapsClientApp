/**
 * Import Dependency
 */
import OrganizationModel from 'model/Organization'

/**
 * Import API
 */
import orgAPI from 'api/org';

/**
 * Declare Variable
 */
const state = {
  organization : null
}

const getters = {
  organization: state => {
    return state.organization;
  },
  isOrganizationAvailable: state => {
    return state.organization !== null;
  },
  getOrgId: state => {
    return (state.organization) 
      ? state.organization.getId()
      : null;
  }
}
const actions = {
  async getOrganization({ commit }) {
    let response = await orgAPI.getOrganization();
    if (response.status === 200 && response.data.length > 0) {
      commit('set_organization', {
        organization: response.data[0]
      })
    } 
  },
  clearOrg({ commit }) {
    commit('clear_org')
  }
}
const mutations = {
  set_organization(state, { organization }) {
    state.organization = new OrganizationModel(organization);
  },
  clear_org(state) {
    state.organization = null
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
