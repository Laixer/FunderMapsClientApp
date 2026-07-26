<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { exchangeCode, logoutRedirect } from '@/services/oidc'
import { useSessionStore } from '@/stores/session'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const failed = ref(false)

onMounted(async () => {
  const code = route.query.code
  const state = route.query.state
  if (typeof code !== 'string') {
    failed.value = true
    return
  }
  try {
    await exchangeCode(code, typeof state === 'string' ? state : '')
    await sessionStore.authenticateFromAccessToken()
    // Lands on the Werkbank rather than the archive: the first thing anyone
    // wants after signing in is their own queue.
    router.replace({ name: 'home' })
  } catch {
    // A callback failure is NOT a credentials problem — the code was issued.
    // It usually means the live SSO session belongs to an account that cannot
    // use this app (e.g. one signed in via maps.fundermaps.com). Do not
    // mislabel it as "wrong password"; offer a working escape.
    failed.value = true
  }
})

// End the SSO session at the provider, then land on /login for a fresh sign-in.
// A plain link back to /login would silently re-authenticate via the still-alive
// SSO session — i.e. straight back into the same wrong account and the same
// error. RP-initiated logout breaks that loop. (See oidc.ts logoutRedirect.)
function signOut() {
  logoutRedirect()
}
</script>

<template>
  <!-- Neutral while the code is exchanged — deliberately not the AuthWrapper
       chrome, so the hand-off back from the auth app does not flash a
       login-page look before landing on the app. -->
  <div class="grid min-h-screen place-content-center gap-4 bg-canvas px-6 text-center">
    <template v-if="failed">
      <p class="text-lg text-body">{{ t('auth.loginFailed') }}</p>
      <button
        type="button"
        class="text-md inline-flex h-8 items-center justify-center rounded-lg border border-green-hover bg-green px-3 font-semibold text-white hover:bg-green-hover"
        @click="signOut"
      >
        {{ t('auth.signInOtherAccount') }}
      </button>
    </template>
    <p v-else class="text-md text-muted">Bezig met inloggen…</p>
  </div>
</template>
