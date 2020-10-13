
import axios from '@/utils/axios'

export default { 
  /**
   * Gets the organization of the currently logged in user.
   */
  getOrganization: () => {
    return axios.get('/api/organization')
  },

  /**
   * Admin call for getting an organization by its id.
   */
  getOrganizationById: ({ id }) => {
    return axios.get(`/api/admin/organization/${id}`)
  },

  /**
   * Admin call for getting all existing organizations.
   */
  getAllOrganizations: () => {
    return axios.get('/api/admin/organization/')
  },

  /**
   * Updates the organization of teh currently logged in user.
   */
  updateOrganization: ({ data }) => {
    // TODO This is a quickfix, see FunderMapsClientApp issue #80
    data.homeAddressNumber = data.homeAddressNumber ? Number(data.homeAddressNumber) : null;
    data.postalAddressNumber = data.postalAddressNumber ? Number(data.postalAddressNumber) : null;

    return axios.put(`/api/organization/`, data)
  },

  /**
   * Admin call updating an organization.
   */
  updateOrganizationAsAdmin: ({ organizationId, data }) => {
    // TODO This is a quickfix, see FunderMapsClientApp issue #80
    data.homeAddressNumber = data.homeAddressNumber ? Number(data.homeAddressNumber) : null;
    data.postalAddressNumber = data.postalAddressNumber ? Number(data.postalAddressNumber) : null;

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
