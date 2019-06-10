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
  },
  async addUnsavedSample({ commit }) {
    commit('add_unsaved_sample')
  },
  async updateSample({ commit }, { id, data }) {
    let response = await samplesAPI.updateSample({ id, data });
    if (response.status === 204) {
      commit('update_sample', {
        id,
        data
      })
    }
  },
  async createSample({ commit }, { data }) {
    let response = await samplesAPI.createSample({ data });
    if (response.status === 200 && response.data) {
      commit('update_sample', {
        id: response.data.id,
        sample: response.data
      })
    }
  }
}
const mutations = {
  set_samples(state, { samples }) {
    state.samples = samples.map( sample => {
      return new SampleModel({ sample, stored: true })
    })
  },
  clear_samples(state) {
    state.samples = [];
  },
  add_unsaved_sample(state) {
    if (state.samples.length === 0) {
      state.samples = [
        new SampleModel({ sample: {}, stored: false })
      ]
    } else {
      let address = Object.assign({}, state.samples[0].address);
      let sample = Object.assign({}, state.samples[0]);
      sample.id = ''
      sample.address = address;
      state.samples.unshift(
        new SampleModel({
          sample,
          stored: false
        })
      )
    }
  },
  update_sample(state, { id, data }) {
    let index = state.samples.findIndex((sample) => sample.id === id)
    state.samples[index] = Object.assign(
      state.samples[index], data
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
