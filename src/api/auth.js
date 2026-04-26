import axios from '@/utils/axios'

/**
 * FunderMapsApi auth endpoints. Better Auth's bearer-token flow:
 *   - POST /api/auth/sign-in/email → { token, user, redirect }
 *   - GET  /api/auth/get-session   → { session, user } (also extends session)
 *   - POST /api/auth/sign-out      → invalidates the bearer
 *
 * No refresh tokens; sessions are extended in place via /get-session.
 */

export default {
  login: ({ email, password }) => {
    return axios.post('/api/auth/sign-in/email', { email, password })
  },
  signOut: () => {
    return axios.post('/api/auth/sign-out')
  },
  getSession: () => {
    return axios.get('/api/auth/get-session')
  },
}
