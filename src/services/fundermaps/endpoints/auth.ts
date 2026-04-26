import { post, get } from '../client'

interface BetterAuthSignInResponse {
  redirect: boolean
  token: string
  user: { id: string; email: string; role?: string }
}

interface BetterAuthGetSessionResponse {
  session: { token: string; expiresAt: string; userId: string; id: string }
  user: { id: string; email: string; role?: string }
}

export async function login(email: string, password: string): Promise<string> {
  const res = (await post({
    endpoint: '/auth/sign-in/email',
    body: { email, password },
    requireAuth: false,
  })) as BetterAuthSignInResponse
  return res.token
}

/**
 * Verify the bearer is still alive server-side. Better Auth has no separate
 * refresh-token concept; sessions extend in-place via /get-session.
 * Throws if the session is dead.
 */
export async function getSession(): Promise<BetterAuthGetSessionResponse> {
  const res = (await get({
    endpoint: '/auth/get-session',
    requireAuth: true,
  })) as BetterAuthGetSessionResponse
  if (!res?.session?.token) throw new Error('Session expired')
  return res
}

export async function signOut() {
  return await post({
    endpoint: '/auth/sign-out',
    requireAuth: true,
  })
}

export default { login, getSession, signOut }
