import { computed, type ShallowRef, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

import api from '@/services/fundermaps'
import {
  getAccessToken,
  hasAccessToken,
  removeAccessToken,
  removeIdToken,
  storeAccessToken,
} from '@/services/fundermaps/session'
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

async function login(email: string, password: string) {
  try {
    const token = await api.auth.login(email, password)
    storeAccessToken(token)
    currentUser.value = await api.user.me()
  } catch (e) {
    clearLocalSession()
    throw e
  }
}

/**
 * On a fresh page load, if a bearer is present, verify it by fetching /me.
 * If verification fails the local session is cleared.
 */
async function authenticateFromAccessToken() {
  if (!hasAccessToken()) {
    clearLocalSession()
    return
  }
  try {
    currentUser.value = await api.user.me()
  } catch (e) {
    clearLocalSession()
    throw e
  }
}

function clearLocalSession() {
  removeAccessToken()
  removeIdToken()
  currentUser.value = null
}

async function logout() {
  if (getAccessToken()) {
    try {
      await api.auth.signOut()
    } catch {
      // server-side invalidation is best-effort; always clear locally
    }
  }
  clearLocalSession()
}

function useSession() {
  const router = useRouter()

  async function logoutAndRedirect() {
    await logout()
    router.push({ name: 'login' })
  }

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
    authenticateFromAccessToken,
    login,
    logout,
    logoutAndRedirect,
  }
}

export const useSessionStore = defineStore('session', useSession)
