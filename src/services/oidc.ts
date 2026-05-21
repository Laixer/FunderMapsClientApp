/**
 * OIDC (authorization-code + PKCE) client for the FunderMaps auth provider.
 *
 * ClientApp is a trusted first-party OIDC client: unauthenticated users are
 * sent to the auth app (auth.fundermaps.com) to sign in, then returned here
 * with a code we exchange for an access token. The token is stored as the
 * bearer (same `access_token` slot the app already uses) — no consent screen,
 * and no refresh token for now (the access token is re-obtained by bouncing
 * through /authorize again, which is silent while the SSO session is alive).
 */
import {
  getIdToken,
  removeAccessToken,
  removeIdToken,
  storeAccessToken,
  storeIdToken,
} from './fundermaps/session'

const API = (import.meta.env.VITE_FUNDERMAPS_URL || '').replace(/\/+$/, '')
const CLIENT_ID = 'clientapp'
const VERIFIER_KEY = 'oidc_pkce_verifier'
const STATE_KEY = 'oidc_state'

function redirectUri(): string {
  return `${window.location.origin}/auth/callback`
}

function randomUrlSafe(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return base64url(bytes)
}

function base64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(new Uint8Array(digest))
}

/** Begin login: stash PKCE verifier + state, then navigate to /oauth2/authorize. */
export async function loginRedirect(): Promise<void> {
  const verifier = randomUrlSafe(48)
  const state = randomUrlSafe(16)
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: 'openid email profile',
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
  })
  window.location.assign(`${API}/api/auth/oauth2/authorize?${params.toString()}`)
}

/** Finish login: validate state, exchange the code for a token, store it. */
export async function exchangeCode(code: string, state: string): Promise<void> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  const expectedState = sessionStorage.getItem(STATE_KEY)
  if (!verifier || !state || state !== expectedState) {
    throw new Error('Invalid OIDC state')
  }

  const res = await fetch(`${API}/api/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  })
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status})`)
  }
  const tokens = (await res.json()) as { access_token?: string; id_token?: string }
  if (!tokens.access_token) throw new Error('No access token in token response')

  storeAccessToken(tokens.access_token)
  if (tokens.id_token) storeIdToken(tokens.id_token)
  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
}

/**
 * RP-initiated logout: clear local tokens, then end the SSO session at the
 * provider via /oauth2/end-session (id_token_hint identifies the session). The
 * provider clears the Better Auth session cookie and redirects to
 * post_logout_redirect_uri — here /login, which re-enters the flow and (now
 * that the SSO session is gone) shows a fresh login prompt.
 *
 * Without ending the SSO session, a local-only logout would just bounce back
 * through /authorize and silently log the user straight back in.
 */
export function logoutRedirect(): void {
  const idToken = getIdToken()
  removeAccessToken()
  removeIdToken()

  const postLogout = `${window.location.origin}/login`
  if (!idToken) {
    // No id_token to prove the session — best effort: just go to login.
    window.location.assign(postLogout)
    return
  }
  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: postLogout,
    client_id: CLIENT_ID,
  })
  window.location.assign(`${API}/api/auth/oauth2/end-session?${params.toString()}`)
}
