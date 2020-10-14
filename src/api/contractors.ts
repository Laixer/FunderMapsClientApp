
import axios from '../utils/axios'

export default {
  getContractors() {
    return axios.get('/api/contractor?limit=1000')
  }
}