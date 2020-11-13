/**
 * Import Dependency
 */

/**
 * Import API
 */
import mapAPI from "api/map";

/**
 * Declare Variable
 */
const state = {
  mapboxIsReady: false,
  bundles: [],
  layers: [],
  activeBundle: null
};

const getters = {
  isMapboxReady: state => state.mapboxIsReady,
  mapBundles: state => state.bundles,
  mapLayers: state => state.layers,
  activeBundle: state => state.activeBundle,
  hasActiveBundle: state => state.activeBundle !== null,
  activeLayers: state =>  state.layers.filter(layer => state.activeBundle.layerConfiguration.layers.find(x => x.layerId === layer.id) ? true : false),
  hasMapBundles: state => state.bundles.length > 0
};

const actions = {
  async getMapBundles({ dispatch, commit }) {
    const response = await mapAPI.getBundles();
    const bundles = response.data;
    if (response.status === 200 && bundles && Array.isArray(bundles)) {
      commit("set_bundles", { bundles: bundles });
      await Promise.all(
        bundles.map(async bundle => {
          await dispatch("getMapLayer", bundle);
        })
      );
    }
  },
  async getMapLayer({ commit }, bundle) {
    const layers = await Promise.all(
      bundle.layerConfiguration.layers.map(async layerConfig => {
        const response = await mapAPI.getLayer(layerConfig.layerId);
        const layer = response.data;
        if (response.status === 200 && layer) {
          return response.data;
        }
      })
    );
    commit("set_layers", { layers: layers });
  },
  clearMapState({ commit }) {
    commit("clear_state");
  }
};
const mutations = {
  mapboxIsReady(state, { status }) {
    state.mapboxIsReady = status;
  },
  setActiveBundle(state, { id }) {
    console.log("setting active bundle", id);
    state.activeBundle = state.bundles.find(bundle => bundle.id === id) || null;
  },
  set_bundles(state, { bundles }) {
    const tmp = state.bundles;

    bundles.forEach(newBundle => {
      const found = tmp.find(oldBundle => oldBundle.id === newBundle.id);
      if (found) {
        tmp.remove(found);
      }
      tmp.push(newBundle);
    });
    state.bundles = tmp;
  },
  set_layers(state, { layers }) {
    const tmp = state.layers;

    layers.forEach(newLayer => {
      const found = tmp.find(oldLayer => oldLayer.id === newLayer.id);
      if (found) {
        tmp.remove(found);
      }
      tmp.push(newLayer);
    });
    state.layers = tmp;
  },
  clear_state(state) {
    state.bundles = null;
    state.activeBundle = null;
    state.layers = null;
    state.activeLayers = null;
  }
};

/**
 * Export
 */
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
