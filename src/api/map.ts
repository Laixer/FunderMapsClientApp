
import axios from '../utils/axios'

export default {
  getLayers() {
    return axios.get('/api/map/layer');
  }
}
