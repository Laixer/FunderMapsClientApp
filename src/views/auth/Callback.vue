<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import Spinner from '@/components/Common/Spinner.vue'
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
    router.replace({ name: 'inquiry-list' })
  } catch {
    // A callback failure is NOT a credentials problem — the code was issued.
    // It usually means the live SSO session belongs to an account that can't
    // use this app (e.g. one signed in via maps.fundermaps.com). Don't mislabel
    // it as "wrong password"; offer a working escape (signOut() below).
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
  <!-- Neutral loading while the code is exchanged — deliberately NOT the
       AuthWrapper login chrome, so the hand-off back from the auth app doesn't
       flash a login-page look before landing on the app. -->
  <div class="grid min-h-screen place-content-center px-6 text-center">
    <template v-if="failed">
      <p class="text-sm text-grey-700">{{ t('auth.loginFailed') }}</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
        @click="signOut"
      >
        {{ t('auth.signInOtherAccount') }}
      </button>
    </template>
    <Spinner v-else />
  </div>
</template>
