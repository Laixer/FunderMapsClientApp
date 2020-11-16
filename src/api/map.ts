
import axios from '../utils/axios'

export default {
  getBundles() {
    return axios.get('/api/bundle');
  },
  getMetadata(bundle: any) {
    return axios.get(`${process.env.VUE_APP_MVT_BASE_URL}ORG${bundle.organizationId}/BND${bundle.id}/MVT/${bundle.id}/metadata.json`);
  },
  getLayer(id: string) {
    return axios.get(`/api/layer/${id}`);
  }
}
