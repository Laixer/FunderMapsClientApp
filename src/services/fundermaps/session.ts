/**
 * Bearer-token storage for the Better Auth session. ClientApp stores only the
 * opaque token — no JWT decoding, no refresh tokens. The server is the source
 * of truth on whether the session is alive (call /auth/get-session to check).
 */

const TOKEN_KEY = 'access_token'
// The OIDC id_token, kept only for `id_token_hint` on RP-initiated logout
// (/oauth2/end-session). Not used for API auth — that's the access token.
const ID_TOKEN_KEY = 'id_token'

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

export function storeIdToken(token: string): void {
  localStorage.setItem(ID_TOKEN_KEY, token)
}

export function getIdToken(): string | null {
  return localStorage.getItem(ID_TOKEN_KEY)
}

export function removeIdToken(): void {
  localStorage.removeItem(ID_TOKEN_KEY)
}
