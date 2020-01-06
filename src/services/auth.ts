
import authAPI from '../api/auth'
import { organizationUserRoleClaimType, userClaimType } from '../config/claimTypes'

/**
 * Check whether the user has credentials stored
 * Note: the credentials may be invalid
 */
export function isLoggedIn() {
  return !!(getUser() && getAccessToken());
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
  removeUserInformation();
}

/**
 * Renew the authentication credentials
 */
export const refreshLogin = () => {
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
  let user = getUser()
  return (user)
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

export function isAdmin() {
  return getRole() === 'administrator';
}
export function isSuperUser() {
  return getOrganizationRole() === 'superuser';
}
export function isVerifier() {
  return getOrganizationRole() === 'verifier'
}
export function isWriter() {
  return getOrganizationRole() === 'writer'
}
export function isReader() {
  return getOrganizationRole() === 'reader'
}
export function canManageUsers() {
  return isSuperUser()
}
export function canApprove() {
  return isVerifier() || isSuperUser()
}
export function canWrite() {
  return canApprove() || isWriter()
}
export function canRead() {
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
  localStorage.setItem(user_key, JSON.stringify(response.data.principal))
  sessionStorage.setItem(last_user, response.data.principal.email)
}

function removeUserInformation() {
  localStorage.removeItem(access_token_key)
  localStorage.removeItem(user_key)
}

/**
 * Get the user from storage
 */
function getUser(): any {
  let userObject = localStorage.getItem(user_key);
  if (!userObject) {
    return false;
  }
  return JSON.parse(userObject) || false
}

/**
 * Get the last login user from session storage
 */
function getLastUserEmailFromStorage() {
  return sessionStorage.getItem(last_user) || false
}

/**
 * Get the access token from storage
 */
function getAccessToken(): string | null {
  return localStorage.getItem(access_token_key)
}

/**
 * 
 */
function getOrganizationRole() {
  try {
    let user = getUser()
    let role = user.claims.find((claim: any) => {
      return organizationUserRoleClaimType == claim.type
    })
    return role.value.toLowerCase();
  } catch (err) {
    return ''
  }
}

/**
 * 
 */
function getRole() {
  try {
    let user = getUser()
    let role = user.claims.find((claim: any) => {
      return userClaimType == claim.type
    })
    return role.value.toLowerCase();
  } catch (err) {
    return ''
  }
}
