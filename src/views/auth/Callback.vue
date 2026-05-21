<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import Spinner from '@/components/Common/Spinner.vue'
import { exchangeCode } from '@/services/oidc'
import { useSessionStore } from '@/stores/session'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const error = ref<string | null>(null)

onMounted(async () => {
  const code = route.query.code
  const state = route.query.state
  if (typeof code !== 'string') {
    error.value = t('auth.invalidCredentials')
    return
  }
  try {
    await exchangeCode(code, typeof state === 'string' ? state : '')
    await sessionStore.authenticateFromAccessToken()
    router.replace({ name: 'inquiry-list' })
  } catch {
    error.value = t('auth.invalidCredentials')
  }
})
</script>

<template>
  <!-- Neutral loading while the code is exchanged — deliberately NOT the
       AuthWrapper login chrome, so the hand-off back from the auth app doesn't
       flash a login-page look before landing on the app. -->
  <div class="grid min-h-screen place-content-center">
    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    <Spinner v-else />
  </div>
</template>
