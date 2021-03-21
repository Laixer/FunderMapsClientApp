import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'

import address from './address'
import org from './org'
import reports from './reports'
import report from './report'
import user from './user'
import orgUsers from './orgUsers'
import samples from './samples'
import attestation from './attestation'
import version from './version'
import map from './map'
import contractors from './contractors'
import reviewers from './reviewers'

Vue.use(Vuex)

const store: StoreOptions<{}> = {
  modules: {
    org,
    reports,
    user,
    orgUsers,
    report,
    samples,
    attestation,
    version,
    map,
    contractors,
    reviewers,
    address,
  },
  state: {
  },
  mutations: {
  },
  actions: {
    clearAll({ commit }) {
      commit("address/reset")
      commit("org/reset")
      commit("reports/reset")
      commit("report/reset")
      commit("user/reset")
      commit("org/reset")
      commit("orgUsers/reset")
      commit("samples/reset")
      commit("attestation/reset")
      commit("version/reset")
      commit("map/reset")
      commit("contractors/reset")
      commit("reviewers/reset")
    }
  }
};



export default new Vuex.Store(store);
