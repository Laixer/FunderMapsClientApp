
import axios from '@/utils/axios'

export default { 
  login: ({ email, password }) => {
    return axios.post(
      '/api/auth/signin', 
      { email, password }
    )
  },
  refresh: () => {
    return axios.get('/api/auth/token-refresh')
  }
}
