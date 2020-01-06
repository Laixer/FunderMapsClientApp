
import axios from '../utils/axios'

export default {
  getVersion() {
    return axios.get('/api/version');
  }
}
