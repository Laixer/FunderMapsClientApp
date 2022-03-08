import axios from "@/utils/axios";

// Collection
const getSamples = ({ inquiryId, limit, offset }) => {
  return axios.get(`/api/inquiry/${inquiryId}/sample`, {
    params: { limit, offset },
  });
};

const getSampleCount = ({ inquiryId }) => {
  return axios.get(`/api/inquiry/${inquiryId}/sample/stats`);
};

// Single
const updateSample = ({ inquiryId, sampleId, data }) => {
  console.log("I am updated");
  return axios.put(`/api/inquiry/${inquiryId}/sample/${sampleId}`, data);
};
const createSample = ({ inquiryId, data }) => {
  return axios.post(`/api/inquiry/${inquiryId}/sample`, data);
};
const deleteSample = ({ inquiryId, sampleId }) => {
  return axios.delete(`/api/inquiry/${inquiryId}/sample/${sampleId}`);
};

export default {
  getSamples,
  getSampleCount,

  updateSample,
  createSample,
  deleteSample,
};
