
import axios from '../utils/axios'

export default {
  getContractors() {
    return axios.get('/api/organization/contractors?limit=1000')
  }
}