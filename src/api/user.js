import axios from '@/utils/axios'

/**
 * Self-user endpoints on FunderMapsApi (canonical TS API shape).
 * Wire format: snake_case throughout.
 */

export default {
  getUser: () => {
    return axios.get('/api/user/me')
  },
  updateUser: ({
    given_name, family_name, picture, job_title, phone_number,
  }) => {
    return axios.put('/api/user/me', {
      given_name, family_name, picture, job_title, phone_number,
    })
  },
}
