import axios from '@/utils/axios'

export default {
  /**
   * Gets the organization of the currently logged in user.
   */
  getOrganization: () => {
    return axios.get('/api/organization')
  },

  /**
   * Get an organization by its id for viewing purposes.
   */
  getOrganizationById: ({ id }) => {
    return axios.get(`/api/organization/${id}`)
  },

  /**
   * Get all organizations for selection purposes.
   */
  getAllOrganizations: () => {
    return axios.get('/api/organization/all')
  }
}
