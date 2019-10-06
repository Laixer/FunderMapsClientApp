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
  report : false,
  contractors: [],
  reviewers: []
}

const getters = {
  activeReport: state => state.report,
  contractors: state => state.contractors,
  reviewers: state => state.reviewers
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
  async updateReport({ commit }, { id, document, data }) {
    let response = await reportAPI.updateReport({ id, document, data })
    if (response.status === 204) {
      commit('set_report', {
        report: data
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
  async submitForReview({ commit, state }) {
    let response = await reportAPI.submitForReview({
      id: state.report.id, 
      document: state.report.document_id,
    })
    if (response.status === 204) {
      commit('set_report_pending_review')
    }
  },
  async getContractors({ commit }) {
    let response = await reportAPI.getContractors()
    if (response.status === 200 && response.data) {
      commit('set_contractors', {
        contractors: response.data
      })
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
  set_contractors(state, { contractors }) {
    state.contractors = contractors
  },
  set_reviewers(state, { reviewers }) {
    state.reviewers = reviewers
  },
  clear_contractors(state) {
    state.contractors = []
  }, 
  clear_reviewers(state) {
    state.reviewers = []
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
