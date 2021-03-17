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
const defaultState = {
  reports : [],
  reportCount: 0
}

const state = Object.assign({}, defaultState);

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
  /**
   * Gets reports from the API based on a pagination.
   */
  async getReports({ commit }, { limit, page }) {
    let offset = limit * (page - 1);
    let response = await reportAPI.getReports({ limit, offset });
    if (response.status === 200 && response.data.length > 0) {
      commit('set_reports', {
        reports: response.data
      })
    }
  },

  /**
   * Gets the total report count from the API.
   */
  async getReportCount({ commit }) {
    let response = await reportAPI.getReportCount();
    if (response.status === 200) {
      commit('set_report_count', {
        reportCount: response.data.count
      });
    }
  },

  clearReports({ commit }) {
    commit('clear_reports')
  }
}
const mutations = {
  set_reports(state, { reports }) {
    state.reports = reports
      .map(report => new ReportModel(report))
      .sort(function (a, b) {
        if (a.createDate > b.createDate) return -1;
        if (a.createDate < b.createDate) return 1;
        return 0;
      });
  },
  set_report_count(state, { reportCount }) {
    state.reportCount = reportCount;
  },
  clear_reports(state) {
    state.reports = []
    state.reportCount = false
  },
  reset(state) {
    Object.assign(state, defaultState);
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
