/**
 * Import Dependency
 */
import AttributedOrganisation from 'model/AttributedOrganisation'

/**
 * Import API
 */
import contractorsAPI from 'api/contractors';

/**
 * Declare Variable
 */
const state = {
  contractors : []
}

const getters = {
  areContractorsAvailable: state => state.contractors.length > 0,
  contractors: state => state.contractors,
  getContractorById: state => ({ id }) => state.contractors.find(contractor => contractor.id === id)
}
const actions = {
  async getContractors({ commit }) {
    let response = await contractorsAPI.getContractors();
    if (response.status === 200 && response.data) {
      commit('set_contractors', { contractors: response.data })
    }
  },
  clearVersion({ commit }) {
    commit('clear_contractors')
  }
}
const mutations = {
  set_contractors(state, { contractors }) {
    state.contractors = contractors.map(contractor => new AttributedOrganisation(contractor.id, 'Uitvoerder', contractor.name))
  },
  clear_contractors(state) {
    state.contractors = null;
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
