/**
 * Import Dependency
 */
import { GetterTree, ActionTree, MutationTree, Module } from 'vuex';

/**
 * Import API
 */
import versionAPI from '../api/version';

interface VersionState {
  version: string | null;
}

/**
 * Declare module properties.
 */
const namespaced: boolean = true;

const state: VersionState = {
  version: null
};

const getters: GetterTree<VersionState, {}> = {
  version(state): string | null {
    return state.version;
  },
  isEmpty(state): boolean {
    return !!state.version;
  }
};

const actions: ActionTree<VersionState, {}> = {
  async getVersion({ commit }): Promise<void> {
    let response = await versionAPI.getVersion();
    if (response.status === 200 && response.data) {
      const payload: string = response.data.versionString;
      commit('set_version', payload)
    }
  },
  clearVersion({ commit }): void {
    commit('clear_version')
  }
};

const mutations: MutationTree<VersionState> = {
  set_version(state, version: string) {
    state.version = version
  },
  clear_version(state) {
    state.version = null;
  }
};

/**
 * Export
 */
const version: Module<VersionState, {}> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
};

export default version;
