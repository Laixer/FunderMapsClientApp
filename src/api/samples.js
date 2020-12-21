
import axios from '@/utils/axios'

// Collection
const getSamples = ({ inquiryId }) => {
  return axios.get(`/api/inquiry/${inquiryId}/sample?limit=200000`)
}

// Single
const updateSample = ({ inquiryId, sampleId, data }) => {
  return axios.put(`/api/inquiry/${inquiryId}/sample/${sampleId}`, data)
}
const createSample = ({ inquiryId, data }) => {
  return axios.post(`/api/inquiry/${inquiryId}/sample`, data)
}
const deleteSample = ({ inquiryId, sampleId }) => {
  return axios.delete(`/api/inquiry/${inquiryId}/sample/${sampleId}`)
}

export default {
  getSamples,

  updateSample,
  createSample,
  deleteSample
}
