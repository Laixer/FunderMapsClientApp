
import axios from '@/utils/axios'

export default {
  /**
   * Gets all organization users for the organization to
   * which the current user belongs.
   */
  getOrganizationUsers: () => {
    return axios.get(`/api/organization/user`)
  },

  /**
   * Admin call to get all organization users for a given
   * organization.
   */
  adminGetOrganizationUsers: ({ organizationId }) => {
    return axios.get(`/api/admin/organization/${organizationId}/user`)
  },

  /**
   * Updates a user in the organization that the current user
   * belongs to.
   */
  updateOrganizationUser: ({ userId, data }) => {
    return axios.put(`/api/organization/user/${userId}`, data)
  },

  /**
   * Admin call that updates any user in any organization.
   */
  adminUpdateOrganizationUser: ({ organizationId, userId, data }) => {
    return axios.put(`/api/admin/organization/${organizationId}/user/${userId}`, data)
  },

  /**
   * Updates a user role in the organization that the current user
   * belongs to.
   */
  updateOrganizationUserRole: ({ userId, role }) => {
    return axios.post(`/api/organization/user/${userId}/change-organization-role`, { role: role })
  },

  /**
   * Admin call that updates any user role in any organization.
   */
  adminUpdateOrganizationUserRole: ({ organizationId, userId, role }) => {
    return axios.post(`/api/admin/organization/${organizationId}/user/${userId}/change-organization-role`, { role: role })
  },

  /**
   * Creates a new user in the organization that the current
   * user belongs to.
   */
  createOrganizationUser: ({ data }) => {
    return axios.post(`/api/organization/user/`, data)
  },

  /**
   * Admin call that creates a user in a given organization.
   */
  adminCreateOrganizationUser: ({ organizationId, data }) => {
    return axios.post(`/api/admin/organization/${organizationId}/user/`, data)
  },

  /**
   * Removes a user from the organization that the current
   * user belongs to.
   */
  removeOrganizationUser: ({ userId }) => {
    return axios.delete(`/api/organization/user/${userId}`)
  },

  /**
   * Admin call that removes an organization user.
   */
  adminRemoveOrganizationUser: ({ organizationId, userId }) => {
    return axios.delete(`/api/admin/organization/${organizationId}/user/${userId}`)
  }
}
