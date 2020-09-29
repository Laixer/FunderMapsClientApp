
import axios from '@/utils/axios'

// Collection
const getSamples = ({ inquiryId }) => {

  return axios.get(`/api/inquiry/${inquiryId}/sample`)
}

// Single
const updateSample = ({ inquiryId, sampleId, data }) => {
  return axios.put(`/api/inquiry/${inquiryId}/sample/${sampleId}`, data)
}
const createSample = ({ inquiryId, data }) => {
  console.log('Creating sample, data', data)
  return axios.post(`/api/inquiry/${inquiryId}/sample`, data)
}
const deleteSample = ({ inquiryId, sampleId }) => {
  return axios.delete(`/api/inquiry/${inquiryId}/sample/${sampleId}`)
}

function mapSampleEnums(data) {
  //data.substructure = 0;
  //console.log('mapSampleEnums created:', data);
  return data;
}

export default { 
  getSamples,

  updateSample,
  createSample,
  deleteSample
}
