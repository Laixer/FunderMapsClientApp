import authAPI from '../api/auth'
import jwt_decode from "jwt-decode"
import store from "@/store"

/**
 * Check whether the user has credentials stored
 * Note: the credentials may be invalid
 * TODO This should be checked
 */
export function isLoggedIn(): boolean {
  let token = getAccessToken();
  if (token == null) {
    return false;
  }

  var parsed = getAccessTokenDecoded();
  var time = Math.round((new Date()).getTime() / 1000);
  return parsed.exp > time;
}

/**
 * Login based on email & password. Store credentials on success.
 */
export function login(email: string, password: string) {
  return authAPI
    .login({ email, password })
    .then(handleAuthResponse)
}

/**
 * End the user session
 */
export function logout(): void {
  localStorage.removeItem(access_token_key)
  localStorage.removeItem(user_key)
}

/**
 * Renew the authentication credentials
 */
export function refreshLogin(): void {
  if (isLoggedIn()) {
    authAPI
      .refresh()
      .then(handleAuthResponse)
      .catch(() => {
        // Redirect to Login?
        // console.error(error)
      })
  }
}

/**
 * return authorization header with jwt token
 */
export function authHeader(): object {
  return (isLoggedIn())
    ? { 'Authorization': 'Bearer ' + getAccessToken() }
    : {}
}

export function getUserEmail(): string {
  let user = getUser()
  return (user)
    ? user.email
    : ''
}

export function getUserId(): string {
  let user = getUser()
  return user
    ? user.id
    : ''
}

export function getLastUserEmail(): string {
  let email = getLastUserEmailFromStorage()
  return email
    ? email
    : ''
}


// ****************************************************************************
//  User Roles & Capabilities
// ****************************************************************************

export function isSuperUser(): boolean {
  return getOrganizationRole() === 'superuser';
}
export function isAdmin(): boolean {
  return isSuperUser(); // Admin is equivalent to superuser in this context
}
export function isVerifier(): boolean {
  return getOrganizationRole() === 'verifier'
}
export function isWriter(): boolean {
  return getOrganizationRole() === 'writer'
}
export function isReader(): boolean {
  return getOrganizationRole() === 'reader'
}
export function canManageUsers(): boolean {
  return isSuperUser()
}
export function canApprove(): boolean {
  return isVerifier() || isSuperUser()
}
export function canWrite(): boolean {
  return canApprove() || isWriter()
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

// localStorage keys
const user_key = 'user';
const last_user = 'last_user';
const access_token_key = 'access_token';

/**
 * Store the authentication or refresh response
 */
function handleAuthResponse(response: any) {
  localStorage.setItem(access_token_key, response.data.token)
}

/**
 * Get the last login user from session storage
 */
function getLastUserEmailFromStorage() {
  return sessionStorage.getItem(last_user) || false
}

/**
 * Gets the stored access token.
 */
function getAccessToken(): string | null {
  return localStorage.getItem(access_token_key);
}

/**
 * Get the access token from storage and decode it.
 */
function getAccessTokenDecoded(): JwtToken {
  let token = getAccessToken();
  if (!token) {
    throw new Error('Could not get access token when requesting user');
  }

  return jwt_decode(token);
}


/**
 * Get the user from storage.
 */
function getUser(): any {
  return store.getters["user/user"];
}

/**
 * Gets the organization role from the jwt access token.
 */
function getOrganizationRole() {
  try {
    let tokenDecoded = getAccessTokenDecoded();

    return tokenDecoded.cfor.toLowerCase();
  } catch (err) {
    return ''
  }
}
