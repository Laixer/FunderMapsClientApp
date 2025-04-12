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
const defaultState = {
  organization: null,
  allOrganizations: [],
  organizationCollection: null
}

const state = Object.assign({}, defaultState);

const getters = {
  currentOrganization: state => {
    return state.organization;
  },
  /**
   * Getter for all organizations.
   */
  allOrganizations: state => {
    return state.allOrganizations;
  },
  isOrganizationAvailable: state => {
    return state.organization !== null;
  },
  getOrgId: state => {
    return (state.organization)
      ? state.organization.getId()
      : null;
  },
  /**
   * Gets the organization collection from our state.
   */
  getOrganizationCollection: state => {
    return state.organizationCollection
  }
}
const actions = {
  /**
   * Gets the current users organization.
   */
  async getOrganization({ commit, state }) {
    let response = await orgAPI.getOrganization();
    if (response.status === 200 && response.data) {
      commit('set_organization', {
        organization: response.data
      })
      return state.organization;
    }
  },

  /**
   * Get an organization by its id. This will first look up
   * the organization in our state. If it's not found, the
   * organization will be fetched and added to the state.
   */
  async getOrganizationById({ commit, getters }, { id }) {
    if (!id) {
      throw Error('Organization id cannot be null')
    }

    // Only fetch the organization if our collection doesn't contain it.
    if (!getters.getOrganizationCollection || !getters.getOrganizationCollection.find(x => { return x.id === id })) {
      let response = await orgAPI.getOrganizationById({ id });

      if (response.status === 200) {
        commit('add_organization_to_collection', {
          organization: response.data
        })
      }
    }

    return getters.getOrganizationCollection.find(x => { return x.id === id });
  },

  /**
   * Gets all organizations for selection purposes.
   */
  async getAllOrganizations({ commit, getters }) {
    let response = await orgAPI.getAllOrganizations();
    if (response.status === 200) {
      commit('set_all_organizations', {
        organizations: response.data
      })
    }

    return getters.allOrganizations;
  },
  clearOrg({ commit }) {
    commit('clear_org')
  },
}
const mutations = {
  /**
   * Adds an organization to the state organization collection.
   */
  add_organization_to_collection(state, { organization }) {
    if (!state.organizationCollection) {
      state.organizationCollection = new Array();
    }

    state.organizationCollection.push(new OrganizationModel(organization));
  },
  set_organization(state, { organization }) {
    state.organization = new OrganizationModel(organization);
  },
  set_all_organizations(state, { organizations }) {
    state.allOrganizations = organizations.map(org => new OrganizationModel(org));
  },
  clear_org(state) {
    state.organization = null
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
