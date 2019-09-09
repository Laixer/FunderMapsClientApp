
import authAPI from '@/api/auth'
import { organizationUserRoleClaimType, userClaimType } from '@/config/claimTypes'

/**
 * Check whether the user has credentials stored
 * Note: the credentials may be invalid
 */
export const isLoggedIn = () => {
  return !! (getUser() && getAccessToken());
}

/**
 * Login based on email & password. Store credentials on success.
 */
export const login = ({ email, password }) => {
  return authAPI
    .login({ email, password })
    .then(handleAuthResponse)
}

/**
 * End the user session
 */
export const logout = () => {
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
export const authHeader = () => {
  let user = getUser()
  return (user) 
    ? { 'Authorization': 'Bearer ' + getAccessToken() }
    : {}
}

export const getUserEmail = () => {
  let user = getUser()
  return (user)  
    ? user.email 
    : ''
}

export const getUserId = () => {
  let user = getUser()
  return user 
    ? user.id
    : ''
}

export const getLastUserEmail = () => {
  let email = getLastUserEmailFromStorage()
  return email 
    ? email
    : ''
}


// ****************************************************************************
//  User Roles & Capabilities 
// ****************************************************************************

export const isAdmin = () => {
  return getRole() === 'administrator';
}

export const isSuperUser = () => {
  return getOrganizationRole() === 'superuser';
}
export const isVerifier = () => {
  return getOrganizationRole() === 'verifier'
}
export const isWriter = () => {
  return getOrganizationRole() === 'writer'
}
export const isReader = () => {
  return getOrganizationRole() === 'reader'
}
export const canManageUsers = () => {
  return isSuperUser()
}
export const canApprove = () => {
  return isVerifier() || isSuperUser()
}
export const canWrite = () => {
  return canApprove() || isWriter()
}
export const canRead = () => {
  return true; // everyone can read
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
function handleAuthResponse(response) {
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
function getUser() {
  return JSON.parse(localStorage.getItem(user_key)) || false
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
function getAccessToken() {
  return localStorage.getItem(access_token_key) || false
}

/**
 * 
 */
function getOrganizationRole() {
  try {
    let user = getUser()
    let role = user.claims.find((claim) => {
      return organizationUserRoleClaimType == claim.type
    })
    return role.value.toLowerCase(); 
  } catch(err) {
    return ''
  }
}

/**
 * 
 */
function getRole() {
  try {
    let user = getUser()
    let role = user.claims.find((claim) => {
      return userClaimType == claim.type
    })
    return role.value.toLowerCase(); 
  } catch(err) {
    return ''
  }
}
