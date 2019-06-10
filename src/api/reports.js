
import axios from '@/utils/axios'

// Collection
const getReports = ({ limit, offset }) => {
  return axios.get('/api/report', { 
    params: { limit, offset }
  })
}
const getLatestReports = ({ limit }) => {
  return getReports({ limit, offset: 0 })
}

const getReportCount = () => {
  return axios.get('/api/report/stats')
}

// Single
const getReport = ({ id, document }) => {
  return axios.get(`/api/report/${id}/${document}`)
}
const createReport = (data) => {
  return axios.post(`/api/report/`, data)
}
const updateReport = (data) => {
  return axios.put(`/api/report/`, data)
}
const validateReport = ({ id, document, verify, message }) => {
  return axios.put(`/api/report/${id}/${document}/validate`, {
    result: verify,
    message
  })
}

export default { 
  getReports, 
  getLatestReports,
  getReportCount,

  getReport,
  createReport,
  updateReport,
  validateReport
}
