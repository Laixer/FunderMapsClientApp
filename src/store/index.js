import Vue from 'vue'
import Vuex from 'vuex'

import org from './org';
import reports from './reports'
import report from './report'
import user from './user'
import orgUsers from './orgUsers'
import samples from './samples'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    org,
    reports,
    user,
    orgUsers,
    report,
    samples
  },
  state: {

  },
  mutations: {

  },
  actions: {

  }
})
