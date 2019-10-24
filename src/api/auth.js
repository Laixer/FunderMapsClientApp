
import axios from '@/utils/axios'

export default { 
  login: ({ email, password }) => {
    return axios.post(
      '/api/authentication/signin', 
      { email, password }
    )
  },
  refresh: () => {
    return axios.get('/api/authentication/refresh')
  }
}
