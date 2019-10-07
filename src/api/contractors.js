
import axios from '@/utils/axios'

const getContractors = () => {
  return axios.get('/api/report/contractors')
}

export default { 
  getContractors
}