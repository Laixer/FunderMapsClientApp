
import axios from '@/utils/axios'

export default { 
  getUser: () => {
    return axios.get('/api/user')
  },
  updateUser: ({ 
    givenName, lastName, avatar, jobTitle, phoneNumber, email
  }) => {
    return axios.put('/api/user', {
      givenName, lastName, avatar, jobTitle, phoneNumber, email
    })
  },
  // TODO: This is not the way to save the users password
  updateUserPassword: ({ 
    newPassword, oldPassword
  }) => {
    return axios.post('/api/user/change-password', {
      newPassword, oldPassword
    })
  }
}
