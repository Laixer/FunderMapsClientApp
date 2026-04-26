import axios from '../utils/axios'

export default {
  getContractors() {
    return axios.get('/api/data/contractor')
  }
}
