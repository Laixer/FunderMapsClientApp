
import axios from '@/utils/axios'

export default { 
  getOrganization: () => {
    return axios.get('/api/organization')
  }
}
