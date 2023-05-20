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
// import { stat } from "fs";

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
  samples: (state) => {
    return state.samples;
  },
  selectedSample: (state) => {
    return state.selectedSample;
  },
  sampleCount: (state) => {
    return state.sampleCount;
  },
};
const actions = {
  async getSamples({ commit }, { inquiryId, limit, page }) {
    let offset = limit * (page - 1);
    let response = await samplesAPI.getSamples({ inquiryId, limit, offset });
    if (response.status === 200 && response.data.length > 0) {
      var samples = response.data;

      await Promise.all(
        samples.map(async (sample) => {
          const address = await this.dispatch("address/getAddressById", {
            id: sample.address,
          });

          sample.addressFormatted = address.format();
        })
      );

      commit("set_samples", {
        samples: samples,
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
  async addUnsavedSample({ commit }, copyIndex) {
    commit("add_unsaved_sample", copyIndex);
  },
  async setSelectedSample({ commit }, payload) {
    commit("set_selected_sample", payload);
  },

  async updateSampleWithoutStoring({ commit, state }, { sampleId, data }) {
    commit("update_sample", {
      sampleId,
      data,
    });
  },

  async updateSelectedSample({ state, commit }, inquiryId) {
    let data = state.selectedSample;
    let sampleId = data.id;

    let response = await samplesAPI.updateSample({
      inquiryId,
      sampleId,
      data,
    });

    if (response.status === 204) {
      commit("set_selected_sample_stored", true);
      return "succes";
    }
  },

  async updateSample({ commit, state }, { inquiryId, sampleId, data }) {
    const current = await state.selectedSample;

    await samplesAPI.updateSample({
      inquiryId,
      sampleId,
      current,
    });
  },
  // TODO: where does creationstamp come from?
  async createSample({ commit, state }, { inquiryId }) {
    let data = state.selectedSample;

    let response = await samplesAPI.createSample({ inquiryId, data });
    if (response.status === 200 && response.data) {
      commit("update_sample", {
        id: response.data.id,
        data: Object.assign(response.data, {
          creationstamp: data.creationstamp,
          addressFormatted: data.addressFormatted,
          stored: true,
        }),
      });
    }
  },
  async deleteSample({ commit }, { inquiryId, sampleId, creationstamp }) {
    if (sampleId === "" || sampleId == 0) {
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
    if (state.selectedSample && state.selectedSample.stored == false) {
      if (
        confirm(
          "Adres is nog niet opslagen. Weet je zeker dat je de pagina wilt verlaten?"
        ) == false
      ) {
        return;
      }
    }

    if ([5, 6, 7, 8, 9].includes(selectedSample.foundationType)) {
      selectedSample.foundationPiles = false;
    } else {
      selectedSample.foundationPiles = true;
    }

    selectedSample.changes = false;
    state.selectedSample = selectedSample;
  },
  set_samples(state, { samples }) {
    state.samples = samples.map((sample) => {
      return new SampleModel({ sample, stored: true });
    });
  },
  set_sample_count(state, { sampleCount }) {
    state.sampleCount = sampleCount;
  },
  clear_samples(state) {
    state.selectedSample = null;
    state.samples = [];
  },
  /**
   * Copy new sample from top most sample
   */
  add_unsaved_sample(state, copyIndex = 0) {
    let sample_new = new SampleModel({
      sample: {},
      stored: false,
    });

    if (state.samples.length !== 0 && copyIndex !== -1) {
      let sample = clonedeep(state.samples[copyIndex]);

      sample.id = 0;

      // sample.address = address;
      //sample.address.buildingNumber = ''
      //sample.address.buildingNumberSuffix = ''

      // used as alternative to 'id' reference for newly created items
      sample.creationstamp = Date.now();

      sample_new = new SampleModel({
        sample,
        stored: false,
      })
    }

    state.samples.unshift(sample_new);
    state.selectedSample = sample_new;
  },

  set_selected_sample_stored(state, { boolean }) {
    state.selectedSample.stored = true;
  },
  /**
   * Update sample data in store (after positive API response)
   */
  update_sample(state, { sampleId, data }) {
    let index = -1;

    if (sampleId) {
      index = state.samples.findIndex((sample) => sample.id === sampleId);
    }

    // For new samples we depend on an internal timestamp
    if (index === -1) {
      index = state.samples.findIndex(
        (sample) => sample.creationstamp === data.creationstamp
      );
      // state.samples[index].stored = true;
    }

    if (index !== -1) {
      state.samples[index].updateValues({ data });
      // state.samples[index].stored = true;
    }
  },

  // Delete sample.
  delete_sample(state, { id, creationstamp }) {
    let index = state.samples.findIndex((sample) => sample.id === id);
    // For new samples we depend on an internal timestamp
    if (index === -1) {
      index = state.samples.findIndex(
        (sample) => sample.creationstamp === creationstamp
      );
    } else {
      if (
        state.selectedSample &&
        state.samples[index].id == state.selectedSample.id
      ) {
        state.selectedSample = null;
      }
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
