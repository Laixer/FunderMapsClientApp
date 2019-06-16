
import axios from '@/utils/axios'

export default { 
  getOrganization: () => {
    return axios.get('/api/organization')
  },
  updateOrganization: ({ orgId, data }) => {
    return axios.put(`/api/organization/${orgId}`, data)
  }
}
