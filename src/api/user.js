
import axios from '@/utils/axios'

export default { 
  getUser: () => {
    return axios.get('/api/user')
  },
  updateUser: ({ 
    givenName, lastName, avatar, jobTitle, phoneNumber
  }) => {
    return axios.put('/api/user', {
      givenName, lastName, avatar, jobTitle, phoneNumber
    })
  },
  // TODO: This is not the way to save the users password
  updateUserPassword: ({ 
    newPassword, oldPassword
  }) => {
    return axios.post('/api/user/change_password', {
      newPassword, oldPassword
    })
  }
}
