
import axios from '@/utils/axios'

const getContractors = () => {
  return axios.get('/api/organization/contractors?limit=1000')
}

export default { 
  getContractors
}