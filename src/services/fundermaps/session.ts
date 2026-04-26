/**
 * Bearer-token storage for the Better Auth session. ClientApp stores only the
 * opaque token — no JWT decoding, no refresh tokens. The server is the source
 * of truth on whether the session is alive (call /auth/get-session to check).
 */

const TOKEN_KEY = 'access_token'

export function storeAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function hasAccessToken(): boolean {
  return getAccessToken() !== null
}
