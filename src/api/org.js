
import axios from '@/utils/axios'

export default { 
  getOrganization: () => {
    return axios.get('/api/organization')
  },
  getOrganizationById: ({ id }) => {
    return axios.get(`/api/organization/${id}`)
  },
  getAllOrganizations: () => {
    return axios.get('/api/admin/organization/')
  },
  updateOrganization: ({ data }) => {
    return axios.put(`/api/organization/`, data)
  },
  updateOrganizationAsAdmin: ({ organizationId, data }) => {
    return axios.put(`/api/admin/organization/${organizationId}`, data)
  },

  /**
   * Gets all currently existing organization proposals.
   */
  getProposals: () => {
    return axios.get('/api/organization/proposal')
  },
  removeProposal: ({ id }) => {
    return axios.delete(`/api/organization/proposal/${id}`)
  },
  createProposal: ({ name, email }) => {
    return axios.post(`/api/organization/proposal/`, {
      name, email
    })
  },

  /**
   * Used to complete the organization registration.
   */
  createOrganization: ({ email, password, id }) => {
    return axios.post(`/api/organization/${id}/setup`, {
      email, 
      password
    })
  }
}
