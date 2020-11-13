
import axios from '../utils/axios'

export default {
  getBundles() {
    return axios.get('/api/bundle');
  },
  getLayer(id: string) {
    return axios.get(`/api/layer/${id}`);
  }
}
