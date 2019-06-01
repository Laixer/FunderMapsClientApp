/**
 * Import Dependency
 */
import SampleModel from 'model/Sample'

/**
 * Import API
 */
import samplesAPI from 'api/samples';

/**
 * Declare Variable
 */
const state = {
  samples : []
}

const getters = {
  samples: state => {
    return state.samples
  },
  sampleCount: state => {
    return state.samples.length
  }
}
const actions = {
  async getSamples({ commit }, { reportId }) {
    let response = await samplesAPI.getSamples({ reportId });
    if (response.status === 200 && response.data.length > 0) {
      commit('set_samples', {
        samples: response.data
      })
    }
  },
  async clearSamples({ commit }) {
    commit('clear_samples')
  }
}
const mutations = {
  set_samples(state, { samples }) {
    console.log(samples)
    state.samples = samples.map( sample => {
      return new SampleModel(sample)
    })
  },
  clear_samples(state) {
    state.samples = [];
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
