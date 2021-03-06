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
  activeBundle: null,
  hasMapBundles: false,
  hasMapLayers: false
};

const getters = {
  isMapboxReady: state => state.mapboxIsReady,
  mapBundles: state => state.bundles,
  mapLayers: state => state.layers.sort((a, b) => a.name == b.name ? 0 : a.name > b.name ? 1 : -1),
  activeBundle: state => state.activeBundle,
  hasActiveBundle: state => state.activeBundle !== null,
  activeLayers: state => state.layers.filter(layer => state.activeBundle.layerConfiguration.layers.find(x => x.layerId === layer.id)),
  hasMapData: state => state.hasMapBundles && state.hasMapLayers
};

const actions = {
  async getMapBundles({ dispatch, commit }) {
    const response = await mapAPI.getBundles();
    const bundles = response.data;
    if (response.status === 200 && bundles && Array.isArray(bundles)) {

      for (const bundle of bundles) {
        bundle.metadata = await mapAPI.getMetadata(bundle).then(response => response.json())
      }

      let layerData = await Promise.all(
        bundles.map(async bundle => {
          return await dispatch("getMapLayers", bundle);
        })
      );

      const layers = layerData.flat().reduce((p, c) => {
        if (!p.some(el => el.id === c.id)) {
          p.push(c)
        }
        return p
      }, [])

      commit("set_layers", { layers: layers })
      commit("set_bundles", { bundles: bundles });
    }
  },
  async getMapLayers({ commit }, bundle) {
    return await Promise.all(
      bundle.layerConfiguration.layers.map(async layerConfig => {
        const response = await mapAPI.getLayer(layerConfig.layerId);
        const layer = response.data;
        if (response.status === 200 && layer) {
          return response.data;
        }
      })
    );
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
    state.activeBundle = state.bundles.find(bundle => bundle.id === id) || null;
  },
  set_bundles(state, { bundles }) {
    state.bundles = bundles;
    state.hasMapBundles = true
  },
  set_layers(state, { layers }) {
    state.layers = layers;
    state.hasMapLayers = true
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
