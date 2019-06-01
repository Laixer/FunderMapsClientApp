
import axios from '@/utils/axios'

// Collection
const getSamples = ({ reportId }) => {
  return axios.get(`/api/sample/report/${reportId}`)
}

export default { 
  getSamples
}
