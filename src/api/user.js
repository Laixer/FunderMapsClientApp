
import axios from '@/utils/axios'

export default { 
  getUser: () => {
    return axios.get('/api/user')
  },
  updateUser: ({ 
    given_name, last_name, avatar, job_title, phone_number
  }) => {
    return axios.put('/api/user', {
      given_name, last_name, avatar, job_title, phone_number
    })
  },
  // TODO: This is not the way to save the users password
  updateUserPassword: ({ 
    new_password, old_password
  }) => {
    return axios.post('/api/user/change_password', {
      new_password, old_password
    })
  }
}
