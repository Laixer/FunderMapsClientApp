
import axios from '@/utils/axios'

export default {
  getLayers: async () => await axios.get('/api/map/layer')
}
