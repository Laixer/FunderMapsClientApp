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
  report: false,
  reviewers: []
}

const state = Object.assign({}, defaultState);

const getters = {
  activeReport: state => state.report,
  reviewers: state => state.reviewers
}
const actions = {
  async getReportById({ commit }, { id }) {
    let response = await reportAPI.getReport({ id });
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
  async updateReport({ commit }, { id, data }) {
    let response = await reportAPI.updateReport({ id, data })
    if (response.status === 204) {
      commit('set_report', {
        report: data
      })
    }
  },
  async approveReport({ commit, state }, { message }) {
    if (!message) { message = 'Approving'; }

    let response = await reportAPI.approveInquiry({
      id: state.report.id,
      message: message
    })
    if (response.status === 204) {
      commit('set_report_approved')
    }
  },
  async rejectReport({ commit, state }, { message }) {
    let response = await reportAPI.rejectInquiry({
      id: state.report.id,
      message: message
    })
    if (response.status === 204) {
      commit('set_report_rejected')
    }
  },
  async submitForReview({ commit, state }, message) {
    if (!message) { message = 'Submitting for review'; }

    let response = await reportAPI.submitForReview({
      id: state.report.id,
      message: message,
    })
    if (response.status === 204) {
      commit('set_report_pending_review')
    }
  },

  async getReviewers({ commit }) {
    let response = await reportAPI.getReviewers()
    if (response.status === 200 && response.data) {
      commit('set_reviewers', {
        reviewers: response.data
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
  },
  set_report_approved(state) {
    state.report.setStatus({ status: 2 })
  },
  set_report_rejected(state) {
    state.report.setStatus({ status: 5 })
  },
  set_report_pending_review(state) {
    state.report.setStatus({ status: 4 })
  },
  set_report_status_todo(state) {
    state.report.setStatus({ status: 0 })
  },
  set_reviewers(state, { reviewers }) {
    state.reviewers = reviewers
  },
  clear_reviewers(state) {
    state.reviewers = []
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
