
import axios from '../utils/axios'

export default {
  getReviewers() {
    return axios.get('/api/reviewer')
  }
}
