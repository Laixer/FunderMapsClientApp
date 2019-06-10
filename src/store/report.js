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
  },
  async updateReport({ commit }, data) {
    let response = await reportAPI.updateReport(data)
    if (response.status === 200 && response.data) {
      commit('set_report', {
        report: response.data
      })
    } 
  },
  async approveReport({ commit, state }) {
    let response = await reportAPI.validateReport({
      id: state.report.id, 
      document: state.report.document_id,
      verify: 'Verified'
    })
    if (response.status === 204) {
      commit('set_report_approved')
    }
  },
  async rejectReport({ commit, state }, { message }) {
    let response = await reportAPI.validateReport({
      id: state.report.id, 
      document: state.report.document_id,
      verify: 'Rejected',
      message
    })
    if (response.status === 204) {
      commit('set_report_rejected')
    }
  },
}
const mutations = {
  set_report(state, { report }) {
    state.report = new ReportModel(report);
  },
  clear_report(state) {
    state.report = false;
  },
  set_report_approved(state) {
    state.report.setStatus({ status: 4})
  },
  set_report_rejected(state) {
    state.report.setStatus({ status: 5})
  },
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
