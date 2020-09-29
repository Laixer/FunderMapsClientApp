
import axios from '@/utils/axios'

// Collection
const getReports = ({ limit, offset }) => {
  return axios.get('/api/inquiry', { 
    params: { limit, offset }
  });
}

// TODO Doesn't exist anymore
const getReportCount = () => {
  return 0;
  // return axios.get('/api/inquiry/stats')
}

// Single
const getReport = ({ id }) => {
  return axios.get(`/api/inquiry/${id}/`)
}
const createReport = (data) => {
  return axios.post('/api/inquiry/', data)
}
const updateReport = ({ id, document, data }) => {
  return axios.put(`/api/inquiry/${id}/`, data)
}
/**
 * Approve an inquiry.
 */
const approveInquiry = ({ id,  message }) => {
  return axios.post(`/api/inquiry/${id}/status_approved`, { message });
}
/**
 * Reject an inquiry.
 */
const rejectInquiry = ({ id,  message }) => {

  console.log('rejectInquiry', id, message)

  return axios.post(`/api/inquiry/${id}/status_rejected`, { message });
}
/**
 * Submit an inquiry for review.
 */
const submitForReview = ({id, message }) => {
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
  return axios.get(`/api/inquiry/${id}/download_uri`)
}

// Input options

const getReviewers = () => {
  // TODO Endpoint doesn't exist.
  console.log('Calling getReviewers(), endpoint doesnt exist');
  
  return axios.get('/api/inquiry/reviewers')
}

export default { 
  getReports, 
  getReportCount,

  getReport,
  createReport,
  updateReport,
  approveInquiry,
  rejectInquiry,
  submitForReview,
  setStatusToTodo,
  getDownloadLink,

  getReviewers
}
