
import axios from '@/utils/axios'

export default { 
  getOrganizationUsers: () => {
    return axios.get(`/api/organization/user`)
  },
  updateOrganizationUser: ({ userId, data }) => {
    return axios.put(`/api/organization/user/${userId}`, data)
  },
  createOrganizationUser: ({ data }) => {
    return axios.post(`/api/organization/user/`, data)
  },
  removeOrganizationUser: ({ userId }) => {
    return axios.delete(`/api/organization/user/${userId}`)
  }
}
