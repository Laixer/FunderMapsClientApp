
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
  getProposals: () => {
    return axios.get('/api/organization_proposal')
  },
  removeProposal: ({ token }) => {
    return axios.delete(`/api/organization_proposal/${token}`)
  },
  createProposal: ({ name, email }) => {
    return axios.post(`/api/organization_proposal/`, {
      name, email
    })
  },
  createOrganization: ({ email, password, token }) => {
    return axios.post(`/api/organization_registration/proposal/${token}`, {
      email, password, role: 'superuser'
    })
  }
}
