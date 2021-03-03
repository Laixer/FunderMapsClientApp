/**
 * Import Dependency
 */
import SampleModel from 'model/Sample'
import Vue from 'vue'
import clonedeep from 'lodash.clonedeep'

/**
 * Import API
 */
import samplesAPI from 'api/samples';

/**
 * Declare Variable
 */
const state = {
  samples: []
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
  async getSamples({ commit }, { inquiryId }) {
    let response = await samplesAPI.getSamples({ inquiryId });

    if (response.status === 200 && response.data.length > 0) {
      commit('set_samples', {
        samples: response.data
      })
    }
  },
  async clearSamples({ commit }) {
    commit('clear_samples')
  },
  async addUnsavedSample({ commit }, { data }) {
    commit('add_unsaved_sample', { sample: data })
  },
  async updateSample({ commit }, { inquiryId, sampleId, data }) {
    delete data.createDate;
    delete data.updateDate;
    delete data.deleteDate;

    let response = await samplesAPI.updateSample({ inquiryId, sampleId, data });
    if (response.status === 204) {
      commit('update_sample', {
        id: sampleId,
        data: data
      })
    }
  },
  // TODO: where does creationstamp come from?
  async createSample({ commit }, { inquiryId, data }) {
    delete data.id;
    delete data.inquiry;
    delete data.createDate;
    delete data.updateDate;
    delete data.deleteDate;

    let response = await samplesAPI.createSample({ inquiryId, data });
    if (response.status === 200 && response.data) {
      commit('update_sample', {
        id: response.data.id,
        data: Object.assign(response.data, {
          creationstamp: data.creationstamp
        })
      })
    }
    return response.data.id;
  },
  async deleteSample({ commit }, { inquiryId, sampleId, creationstamp }) {
    if (sampleId) {
      let response = await samplesAPI.deleteSample({ inquiryId, sampleId });
      if (response.status === 204) {
        commit('delete_sample', { sampleId, creationstamp })
      }
    } else {
      // not stored in API yet
      commit('delete_sample', { sampleId, creationstamp })
    }
  }
}
const mutations = {
  set_samples(state, { samples }) {
    state.samples = samples.sort((a, b) => (a.createDate > b.createDate) ? 1 : -1).map(sample => {
      return new SampleModel({ sample, stored: true })
    })
  },
  clear_samples(state) {
    state.samples = [];
  },
  /**
   * Create a new, empty sample
   */
  add_unsaved_sample(state, { sample }) {
    const _sample = new SampleModel({ sample: sample ? sample : {}, stored: false, editorState: 'open' });

    _sample.creationstamp = Date.now();
    state.samples = [...state.samples, _sample]
  },
  /**
   * Update sample data in store (after positive API response)
   */
  update_sample(state, { id, data }) {
    state.samples = state.samples.map(val => {
      if (data.id) {
        if (val.id === data.id) {
          val.updateValues({ data })
        }
      } else if (data.creationstamp) {
        if (val.creationstamp === data.creationstamp) {
          val.updateValues({ data })
        }
      }
      return val;
    })
  },
  // Delete sample.
  delete_sample(state, { id, creationstamp }) {
    if (id) {
      state.samples = state.samples.filter(val => val.id !== id)
    } else if (creationstamp) {
      state.samples = state.samples.filter(val => val.creationstamp !== creationstamp)
    }
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
