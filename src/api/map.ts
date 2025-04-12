/**
 * DEPRECATED: This API module appears to be unused as the Map functionality is disabled.
 * The map route is commented out in the default.vue layout, and no Map.vue view component exists.
 */
import axios from '../utils/axios'

export default {
  getBundles() {
    return axios.get('/api/bundle');
  },
  getMetadata(bundle: any) {
    return fetch(`${process.env.VUE_APP_MVT_BASE_URL}ORG${bundle.organizationId}/BND${bundle.id}/MVT/${bundle.id}/metadata.json`);
  },
  getLayer(id: string) {
    return axios.get(`/api/layer/${id}`);
  }
}
