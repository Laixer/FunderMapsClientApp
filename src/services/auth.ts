/**
 * Session handling for Data Studio.
 *
 * The session is the Better Auth cookie on the API origin. Every FunderMaps
 * app lives on a *.fundermaps.com subdomain, so the browser sends that cookie
 * on credentialed fetches to api.fundermaps.com from here (same-site,
 * SameSite=Lax). Nothing is stored in this app.
 *
 * Login happens at the auth app (auth.fundermaps.com): we send the browser
 * there with `?redirect=` pointing back at the page the user wanted, and the
 * auth app returns them once the cookie is set.
 */

const API = (import.meta.env.VITE_FUNDERMAPS_URL || '').replace(/\/+$/, '')
const AUTH = (import.meta.env.VITE_AUTH_URL || 'https://auth.fundermaps.com').replace(/\/+$/, '')

/** Full-page navigation to the auth app; it sends the user back here after login. */
export function loginRedirect(returnTo: string = window.location.href): void {
  window.location.assign(`${AUTH}/login?redirect=${encodeURIComponent(returnTo)}`)
}

/** Whether the browser currently holds a live Better Auth session for the API. */
export async function hasSession(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/auth/get-session`, { credentials: 'include' })
    if (!res.ok) return false
    const body = await res.json().catch(() => null)
    return !!body?.user
  } catch {
    return false
  }
}

/** End the session server-side (clears the cookie) and return to the auth app. */
export async function logoutRedirect(): Promise<void> {
  try {
    await fetch(`${API}/api/auth/sign-out`, { method: 'POST', credentials: 'include' })
  } catch {
    // best-effort; navigating away regardless
  }
  window.location.assign(`${AUTH}/login`)
}
