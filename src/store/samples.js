/**
 * Import Dependency
 */
import SampleModel from "model/Sample";
import Vue from "vue";
import clonedeep from "lodash.clonedeep";

/**
 * Import API
 */
import samplesAPI from "api/samples";

/**
 * Declare Variable
 */
const defaultState = {
  samples: [],
  selectedSample: null,
  sampleCount: 0,
};

const state = Object.assign({}, defaultState);

const getters = {
  samples: state => {
    return state.samples;
  },
  selectedSample: state => {
    return state.selectedSample;
  },
  sampleCount: state => {
    return state.sampleCount;
  },
};
const actions = {
  async getSamples({ commit }, { inquiryId, limit, page }) {
    let offset = limit * (page - 1);
    let response = await samplesAPI.getSamples({ inquiryId, limit, offset });
    if (response.status === 200 && response.data.length > 0) {
      const test = dispatch("address/getAddressById", {
        id: sample.address,
      });

      console.log(test);

      commit("set_samples", {
        samples: response.data,
      });
    }
  },

  /**
   * Gets the total report count from the API.
   */
  async getSampleCount({ commit }, { inquiryId }) {
    let response = await samplesAPI.getSampleCount({ inquiryId });

    if (response.status === 200) {
      commit("set_sample_count", {
        sampleCount: response.data.count,
      });
    }
  },
  async clearSamples({ commit }) {
    commit("clear_samples");
  },
  async addUnsavedSample({ commit }) {
    commit("add_unsaved_sample");
  },
  async setSelectedSample({ commit }, payload) {
    commit("set_selected_sample", payload);
  },

  async updateSample({ commit, state }, { inquiryId, sampleId, data }) {
    const current = await state.selectedSample;

    const merge = Object.values(
      []
        .concat(current, data)
        .reduce(
          (r, c) => ((r[c.type] = Object.assign(r[c.type] || {}, c)), r),
          {}
        )
    )[0];

    data = merge;

    let response = await samplesAPI.updateSample({
      inquiryId,
      sampleId,
      data,
    });

    if (response.status === 204) {
      commit("update_sample", {
        sampleId,
        data,
      });
    }
  },
  // TODO: where does creationstamp come from?
  async createSample({ commit }, { inquiryId, data }) {
    let response = await samplesAPI.createSample({ inquiryId, data });
    if (response.status === 200 && response.data) {
      commit("update_sample", {
        id: response.data.id,
        data: Object.assign(response.data, {
          creationstamp: data.creationstamp,
        }),
      });
    }
  },
  async deleteSample({ commit }, { inquiryId, sampleId, creationstamp }) {
    if (sampleId === "") {
      // not stored in API yet
      commit("delete_sample", { id: sampleId, creationstamp });
    } else {
      let response = await samplesAPI.deleteSample({ inquiryId, sampleId });
      if (response.status === 204) {
        commit("delete_sample", { id: sampleId, creationstamp });
      }
    }
  },
};
const mutations = {
  set_selected_sample(state, selectedSample) {
    state.selectedSample = selectedSample;
  },
  set_samples(state, { samples }) {
    state.samples = samples.map(sample => {
      // const address = await this.getAddressById({
      //   id: this.selectedSample.address,
      // });

      // sample.formatedAddress = address.format();

      return new SampleModel({ sample, stored: true });
    });
  },
  set_sample_count(state, { sampleCount }) {
    state.sampleCount = sampleCount;
  },
  clear_samples(state) {
    state.samples = [];
  },
  /**
   * Copy new sample from top most sample
   */
  add_unsaved_sample(state) {
    if (state.samples.length === 0) {
      state.samples = [
        new SampleModel({ sample: {}, stored: false, editorState: "open" }),
      ];
    } else {
      console.log("add unsaved hier");
      let sample = clonedeep(state.samples[0]);
      sample.id = "";

      // sample.address = address;
      //sample.address.buildingNumber = ''
      //sample.address.buildingNumberSuffix = ''

      // used as alternative to 'id' reference for newly created items
      sample.creationstamp = Date.now();

      console.log(sample);

      state.samples.unshift(
        new SampleModel({
          sample,
          stored: false,
          editorState: "open",
        })
      );
    }
  },
  /**
   * Update sample data in store (after positive API response)
   */
  update_sample(state, { sampleId, data }) {
    let index = -1;

    if (sampleId) {
      index = state.samples.findIndex(sample => sample.id === sampleId);
    }

    // For new samples we depend on an internal timestamp
    if (index === -1) {
      index = state.samples.findIndex(
        sample => sample.creationstamp === data.creationstamp
      );
    }

    if (index !== -1) {
      state.samples[index].updateValues({ data });
      state.samples[index].stored = true;
    }
  },
  // Delete sample.
  delete_sample(state, { id, creationstamp }) {
    let index = state.samples.findIndex(sample => sample.id === id);
    // For new samples we depend on an internal timestamp
    if (index === -1) {
      index = state.samples.findIndex(
        sample => sample.creationstamp === creationstamp
      );
    } else {
      Vue.delete(state.samples, index);
    }
  },
  reset(state) {
    Object.assign(state, defaultState);
  },
};

/**
 * Export
 */
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
