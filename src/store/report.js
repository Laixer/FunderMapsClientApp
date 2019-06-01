/**
 * Import Dependency
 */
import ReportModel from 'model/Report'

/**
 * Import API
 */
import reportAPI from 'api/reports';

/**
 * Declare Variable
 */
const state = {
  report : false
}

const getters = {
  activeReport: state => {
    return state.report
  },
}
const actions = {
  async getReportByIds({ commit }, { id, document }) {
    let response = await reportAPI.getReport({ id, document });
    if (response.status === 200 && response.data) {
      commit('set_report', {
        report: response.data
      })
    } 
  },
  clearActiveReport({ commit }) {
    commit('clear_report')
  },
  async createReport({ commit }, data) {
    let response = await reportAPI.createReport(data);
    if (response.status === 200 && response.data) {
      commit('set_report', {
        report: response.data
      })
    } 
  }
}
const mutations = {
  set_report(state, { report }) {
    state.report = new ReportModel(report);
  },
  clear_report(state) {
    state.report = false;
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
