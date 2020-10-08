/**
 * Import Dependency
 */
import OrganizationModel from 'model/Organization'
import OrganizationProposalModal from 'model/OrganizationProposalModal'
import Vue from 'vue'

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
  organizations: [],

  // TODO This is used for the admin panel only atm, look into this.
  /**
   * Stores all fetched organizations.
   */
  allOrganizations: [],

  // TODO This is an experiment.
  /**
   * Collection containing all fetched organizations.
   * When a new organization is fetched, it will be 
   * added to the existing collection.
   */
  organizationCollection: null,
  proposals: null
}

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
  },
  // Admin
  organisations: state => {
    return state.organizations
  },
  getOrgById: state => ({ id }) => {
    let result = state.organizations.find(org => {
      return org.id === id
    })
    return result;
  },
  proposals: state => {
    return state.proposals
  },
  areProposalsAvailable: state => {
    return state.proposals !== null
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
   * Gets all organizations from the store.
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
  /**
   * Update the users own organization.
   */
  async updateOrganization({ commit, getters }, { data }) {
    let response = await orgAPI.updateOrganization({ data })
    if (response.status === 204) {
      commit('update_organization', {
        organizationId: getters.currentOrganization.id,
        data
      })
    }
    return response;
  },
  /**
   * Update any organization as an admin.
   */
  async updateOrganizationAsAdmin({ commit }, { organizationId, data }) {
    let response = await orgAPI.updateOrganizationAsAdmin({ organizationId, data })
    if (response.status === 204) {
      commit('update_organization', {
        organizationId, data
      })
    }
    return response;
  },
  async getProposals({ commit }) {
    let response = await orgAPI.getProposals();
    if (response.status === 200 && response.data) {
      commit('set_proposals', {
        proposals: response.data
      })
    } 
  },
  async removeProposal({ commit }, { id }) {
    let response = await orgAPI.removeProposal({ id });
    if (response.status === 204) {
      commit('remove_proposal', {
        id
      })
    } 
  },

  /**
   * Admin call that creates a new organization proposal.
   */
  async createProposal({ commit }, { name, email }) {
    let response = await orgAPI.createProposal({ name, email });
    if (response.status === 200 && response.data) {
      commit('create_proposal', {
        proposal: response.data
      })
    } 
  },
  
  /**
   * Used to complete the organization registration process
   * by creating the first user with email and password.
   */
  async registerOrganization(context, { email, password, id }) {
    return await orgAPI.createOrganization({ email, password, id });
  }
}
const mutations = {
  /**
   * Adds an organization to the state organization collection.
   * TODO Duplicate check.
   */
  add_organization_to_collection(state, { organization }) {
    if (!state.organizationCollection) {
      state.organizationCollection = new Array();
    }

    state.organizationCollection.push(new OrganizationModel(organization));
  },
  set_organizations(state, { organizations }) {
    state.organization = new OrganizationModel(organizations[0]);
    state.organizations = organizations.map(org => new OrganizationModel(org))
  },
  set_organization(state, { organization }) {
    state.organization = new OrganizationModel(organization);
  },
  set_all_organizations(state, { organizations }) {
    state.allOrganizations = organizations.map(org => new OrganizationModel(org));
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
  },
  set_proposals(state, { proposals }) {
    state.proposals = proposals.map(
      proposal => new OrganizationProposalModal(proposal)
    )
  },
  remove_proposal(state, { id }) {
    let index = state.proposals.findIndex(proposal => {
      return proposal.id === id
    })
    Vue.delete(state.proposals, index);
  },
  create_proposal(state, { proposal }) {
    state.proposals.unshift(
      new OrganizationProposalModal(proposal)
    )
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
