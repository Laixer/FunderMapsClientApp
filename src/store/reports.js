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
  reports : []
}


const getters = {
  latestReports: state => ({ count }) => {
    return state.reports.slice(0, (count || 5));
  },
  reports: state => {
    return state.reports
  },
  reportCount: state => {
    return state.reportCount
  }
}
const actions = {
  async getReports({ commit }, { limit, page }) {
    let offset = limit * (page - 1);
    let response = await reportAPI.getReports({ limit, offset });
    if (response.status === 200 && response.data.length > 0) {
      commit('set_reports', {
        reports: response.data
      })
    }
  },
  clearReports({ commit }) {
    commit('clear_reports')
  }
}
const mutations = {
  set_reports(state, { reports }) {
    state.reports = reports.map(report => new ReportModel(report))
  },
  clear_reports(state) {
    state.reports = []
    state.reportCount = false
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
