
import axios from '@/utils/axios'

export const getVersion = async () => {
  return await axios.get('/api/version');
}