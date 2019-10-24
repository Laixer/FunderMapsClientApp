
import axios from '@/utils/axios'

const getContractors = () => {
  return axios.get('/api/organization/contractors')
}

export default { 
  getContractors
}