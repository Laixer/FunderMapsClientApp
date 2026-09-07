import { computed, type ShallowRef, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import api from '@/services/fundermaps'
import type { IUser, OrgRole } from '@/services/fundermaps/interfaces/IUser'

const currentUser: ShallowRef<IUser | null> = shallowRef(null)

const isAuthenticated = computed<boolean>(() => currentUser.value !== null)

const orgRole = computed<OrgRole | null>(
  () => currentUser.value?.organizations?.[0]?.role ?? null,
)

const isSuperUser = computed<boolean>(() => orgRole.value === 'superuser')
const isVerifier = computed<boolean>(() => orgRole.value === 'verifier')
const isWriter = computed<boolean>(() => orgRole.value === 'writer')
const isReader = computed<boolean>(() => orgRole.value === 'reader')
const canWrite = computed<boolean>(() => isSuperUser.value || isWriter.value)
const canApprove = computed<boolean>(() => isSuperUser.value || isVerifier.value)

/**
 * Load the user behind the session cookie. Throws when there is none (the
 * API answers 401), so the router guard can send the user to log in.
 */
async function authenticate() {
  try {
    currentUser.value = await api.user.me()
  } catch (e) {
    clearLocalSession()
    throw e
  }
}

function clearLocalSession() {
  currentUser.value = null
}

/** End the session at the API (clears the cookie). */
async function logout() {
  try {
    await api.auth.signOut()
  } catch {
    // server-side invalidation is best-effort; always clear locally
  }
  clearLocalSession()
}

function useSession() {
  return {
    currentUser,
    isAuthenticated,
    orgRole,
    isSuperUser,
    isVerifier,
    isWriter,
    isReader,
    canWrite,
    canApprove,
    authenticate,
    logout,
  }
}

export const useSessionStore = defineStore('session', useSession)
