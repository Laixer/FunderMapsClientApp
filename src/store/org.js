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
  organization : null,
  // Admin
  organizations: null
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
  },
  // Admin
  organisations: state => {
    return state.organizations
  },
  getOrgById: state => ({ id }) => {
    return state.organizations.find(org => {
      return org.id === id
    })
  }
}
const actions = {
  async getOrganization({ commit }) {
    let response = await orgAPI.getOrganization();
    if (response.status === 200 && response.data.length > 0) {
      commit('set_organizations', {
        organizations: response.data
      })
    } 
  },
  clearOrg({ commit }) {
    commit('clear_org')
  },
  // Admin
  async updateOrg({ commit }, { orgId, data }) {
    let response = await orgAPI.updateOrganization({ orgId, data })
    if (response.status === 204) {
      commit('update_organization', {
        orgId, data
      })
    }
    return response;
  },
}
const mutations = {
  set_organizations(state, { organizations }) {
    state.organization = new OrganizationModel(organizations[0]);
    state.organizations = organizations.map(org => new OrganizationModel(org))
  },
  clear_org(state) {
    state.organization = null
    state.organizations = null
  },
  // Admin
  update_organization(state, { orgId, data }) {
    let index = state.organizations.findIndex(org => {
      return org.id === orgId
    })
    state.organizations[index] = data
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
