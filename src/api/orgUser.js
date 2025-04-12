import axios from '@/utils/axios'

export default {
  /**
   * Gets all organization users for the organization to
   * which the current user belongs.
   */
  getOrganizationUsers: () => {
    return axios.get(`/api/organization/user`)
  }
}
