import { post } from '../client'

export async function signOut() {
  return await post({
    endpoint: '/auth/sign-out',
    requireAuth: true,
  })
}

export default { signOut }
