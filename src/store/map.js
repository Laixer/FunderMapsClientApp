/**
 * Import API
 */
import { bundles } from "config/bundles";

/**
 * Declare Variable
 */
const defaultState = {
  mapboxIsReady: false,
  bundles: bundles,
  activeBundle: bundles[0],
};

const state = Object.assign({}, defaultState);

const getters = {
  isMapboxReady: state => state.mapboxIsReady,
  mapBundles: state => state.bundles,
  activeBundle: state => state.activeBundle,
  hasActiveBundle: state => state.activeBundle !== null,
  activeLayers: state => state.activeBundle.layers,
};

const mutations = {
  mapboxIsReady(state, { status }) {
    state.mapboxIsReady = status;
  },
  setBundles(state, { bundles }) {
    state.bundles = bundles;
    state.activeBundle = bundles[0];
  },
  setActiveBundle(state, { id }) {
    state.activeBundle = state.bundles.find(bundle => bundle.id === id);
  },
};

/**
 * Export
 */
export default {
  namespaced: true,
  state,
  getters,
  mutations
};
