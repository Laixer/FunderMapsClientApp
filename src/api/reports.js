import axios from '@/utils/axios'

/**
 * Inquiry endpoints on FunderMapsApi (canonical TS API shape, no trailing
 * slashes). Wave-3 backed by routes/inquiry.ts.
 */

// Collection
const getReports = ({ limit, offset }) => {
  return axios.get('/api/inquiry', {
    params: { limit, offset },
  });
}
const getReportCount = () => {
  return axios.get('/api/inquiry/stats');
}

// Single
const getReport = ({ id }) => {
  return axios.get(`/api/inquiry/${id}`);
}
const createReport = (data) => {
  return axios.post('/api/inquiry', data);
}
const updateReport = ({ id, data }) => {
  return axios.put(`/api/inquiry/${id}`, data);
}
const deleteInquiry = ({ id }) => {
  return axios.delete(`/api/inquiry/${id}`);
}

// State machine — body { message } only carries motivation for rejection
const submitForReview = ({ id }) => {
  return axios.post(`/api/inquiry/${id}/status_review`);
}
const approveInquiry = ({ id }) => {
  return axios.post(`/api/inquiry/${id}/status_approved`);
}
const rejectInquiry = ({ id, message }) => {
  return axios.post(`/api/inquiry/${id}/status_rejected`, { message });
}
const resetInquiry = ({ id }) => {
  return axios.post(`/api/inquiry/${id}/reset`);
}

const getDownloadLink = ({ id }) => {
  return axios.get(`/api/inquiry/${id}/download`);
}

export default {
  getReports,
  getReport,
  getReportCount,

  createReport,
  updateReport,
  deleteInquiry,

  submitForReview,
  approveInquiry,
  rejectInquiry,
  resetInquiry,

  getDownloadLink,
}
