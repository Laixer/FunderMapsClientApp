import authAPI from '../api/auth'
import store from "@/store"

/**
 * FunderMaps auth — Better Auth (bearer plugin) flow.
 *
 * The token is opaque from the client's perspective — no JWT decoding, no
 * cfor/role claims. Role and identity come from the user store, which is
 * hydrated by /api/user/me on app boot (see store/user.js + the router
 * guard).
 */

// localStorage keys
const access_token_key = 'access_token';
const last_user = 'last_user';

/**
 * Has a session token been issued? Doesn't prove the token is still valid —
 * the API will 401 if it's expired and the response handler redirects to
 * login.
 */
export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

/**
 * Login based on email & password. Stores the bearer token on success.
 */
export function login(email: string, password: string) {
  return authAPI
    .login({ email, password })
    .then((response: any) => {
      // Better Auth /sign-in/email response shape: { token, user, redirect }
      const token = response?.data?.token;
      if (!token) {
        throw new Error('Sign-in succeeded but no token returned');
      }
      localStorage.setItem(access_token_key, token);
      sessionStorage.setItem(last_user, email);
    });
}

/**
 * End the user session. Calls Better Auth /sign-out to invalidate the
 * session server-side, then clears local state. Local state always clears
 * even if the network call fails.
 */
export async function logout(): Promise<void> {
  try {
    await authAPI.signOut();
  } catch {
    // ignore — local state must always reset
  } finally {
    localStorage.removeItem(access_token_key);
  }
}

/**
 * Confirm the current session is still alive. Better Auth has no refresh
 * tokens — /api/auth/get-session both validates the bearer and extends the
 * session in place. Throws if the session is gone (caller redirects to
 * login).
 */
export async function refreshLogin(): Promise<void> {
  if (!isLoggedIn()) return;
  try {
    await authAPI.getSession();
  } catch {
    // Let the next API call surface the 401; don't auto-redirect from here.
  }
}

/**
 * Returns the Authorization header for our API calls (Bearer token).
 */
export function authHeader(): { Authorization?: string } {
  const token = getAccessToken();
  return token ? { Authorization: 'Bearer ' + token } : {};
}

export function getUserEmail(): string {
  const user = getUser();
  return user ? user.email : '';
}

export function getUserId(): string {
  const user = getUser();
  return user ? user.id : '';
}

export function getLastUserEmail(): string {
  return sessionStorage.getItem(last_user) || '';
}


// ****************************************************************************
//  User Roles & Capabilities
// ****************************************************************************

export function isSuperUser(): boolean {
  return getOrganizationRole() === 'superuser';
}
export function isAdmin(): boolean {
  // Global app role 'administrator' (separate from org role) — granted
  // implicitly to superusers too for ClientApp UI gating.
  const u = getUser();
  return u?.role === 'administrator' || isSuperUser();
}
export function isVerifier(): boolean {
  return getOrganizationRole() === 'verifier';
}
export function isWriter(): boolean {
  return getOrganizationRole() === 'writer';
}
export function isReader(): boolean {
  return getOrganizationRole() === 'reader';
}
export function canManageUsers(): boolean {
  return isSuperUser();
}
export function canApprove(): boolean {
  return isVerifier() || isSuperUser();
}
export function canWrite(): boolean {
  return canApprove() || isWriter();
}

/**
 * Checks if a user can write. Being a superuser implies that you can.
 */
export function canUserWrite(): boolean {
  return isSuperUser() || isVerifier() || isWriter();
}

export function canRead(): boolean {
  // Everyone can read
  return true;
}

// ****************************************************************************
//  Private
// ****************************************************************************

function getAccessToken(): string | null {
  return localStorage.getItem(access_token_key);
}

function getUser(): any {
  return store.getters["user/user"];
}

function getOrganizationRole(): string {
  const u = getUser();
  if (!u || typeof u.getOrganizationRole !== 'function') return '';
  return u.getOrganizationRole();
}
