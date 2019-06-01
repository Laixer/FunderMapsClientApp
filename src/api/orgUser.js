
import axios from '@/utils/axios'

export default { 
  getOrganizationUsers: ({ orgId }) => {
    return axios.get(`/api/organization/${orgId}/user`)
  },
  updateOrganizationUser: ({ orgId, user }) => {
    return axios.put(`/api/organization/${orgId}/user/${user.id}`, user)
  }
}
