
import axios from '../utils/axios'

export default async function getVersion() {
  return await axios.get('/api/version');
}
