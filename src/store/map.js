/**
 * Import Dependency
 */

/**
 * Import API
 */
import mapAPI from 'api/map';

/**
 * Declare Variable
 */
const state = {
  mapboxIsReady: false,
  layers: null,
  activeLayer: null
}

const getters = {
  isMapboxReady: state => state.mapboxIsReady,
  mapLayers: state => state.layers,
  activeLayer: state => state.activeLayer,
  hasActiveLayer: state => state.activeLayer !== null,
  hasMapLayers: state => state.layers !== null
}

const actions = {
  async getMapLayers({ commit }) {
    let response = await mapAPI.getLayers()
    if (response.status === 200 && response.data && Array.isArray(response.data)) {
      commit('set_layers', { layers: response.data })
    }
  },
  clearMapState({ commit }) {
    commit('clear_state')
  }
}
const mutations = {
  mapboxIsReady(state, { status }) {
    state.mapboxIsReady = status
  },
  setActiveLayer(state, { id }) {
    state.activeLayer = state.layers.find(layer => layer.id === id) || null
  },
  set_layers(state, { layers }) {
    state.layers = layers.sort((a, b) => (a.order > b.order) ? 1 : -1)
  },
  clear_state(state) {
    state.layers = null
    state.activeLayer = null
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
