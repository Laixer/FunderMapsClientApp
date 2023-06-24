
import axios from '@/utils/axios'

// Collection
const getReports = ({ limit, offset }) => {
  return axios.get('/api/inquiry', {
    params: { limit, offset }
  });
}

/**
 * Gets the total amount of reports in our data store.
 */
const getReportCount = () => {
  return axios.get('/api/inquiry/stats')
}

// Single
const getReport = ({ id }) => {
  return axios.get(`/api/inquiry/${id}/`)
}
const createReport = (data) => {
  return axios.post('/api/inquiry/', data)
}
const updateReport = ({ id, data }) => {
  return axios.put(`/api/inquiry/${id}/`, data)
}
/**
 * Approve an inquiry.
 */
const approveInquiry = ({ id, message }) => {
  return axios.post(`/api/inquiry/${id}/status_approved`, { message });
}
/**
 * Reset an inquiry.
 */
const resetInquiry = ({ id }) => {
  return axios.post(`/api/inquiry/${id}/reset`, {});
}
/**
 * Delete an inquiry.
 */
const deleteInquiry = ({ id }) => {
  return axios.delete(`/api/inquiry/${id}`);
}
/**
 * Reject an inquiry.
 */
const rejectInquiry = ({ id, message }) => {
  return axios.post(`/api/inquiry/${id}/status_rejected`, { message });
}
/**
 * Submit an inquiry for review.
 */
const submitForReview = ({ id, message }) => {
  return axios.post(`/api/inquiry/${id}/status_review`, { message });
}
const setStatusToTodo = ({ id, document }) => {
  return axios.put(`/api/inquiry/${id}/${document}`, {
    id,
    documentId: document,
    status: 0
  })
}
const getDownloadLink = ({ id }) => {
  return axios.get(`/api/inquiry/${id}/download`)
}

// Input options

const getReviewers = () => {
  return axios.get('/api/inquiry/reviewers')
}

export default {
  getReports,

  getReport,
  getReportCount,

  createReport,
  updateReport,

  approveInquiry,
  resetInquiry,
  deleteInquiry,
  rejectInquiry,
  submitForReview,
  setStatusToTodo,
  getDownloadLink,

  getReviewers
}
