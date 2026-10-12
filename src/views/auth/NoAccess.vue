<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AuthWrapper from '@/components/Layout/AuthWrapper.vue'
import { useSessionStore } from '@/stores/session'
import { logoutRedirect } from '@/services/auth'

const { t } = useI18n()
const sessionStore = useSessionStore()
const { currentUser } = storeToRefs(sessionStore)

// This page is public, so the router does not restore the session for it: opened
// directly or reloaded, it read "Je bent ingelogd als ." with an empty name. Ask
// once; without a session the sentence about the account simply stays away.
onMounted(() => {
  if (!currentUser.value) sessionStore.authenticate().catch(() => {})
})
</script>

<template>
  <AuthWrapper :title="t('error.noAccessTitle')">
    <div
      class="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-8 py-7 text-center"
    >
      <p class="font-mono text-2xl text-label">403</p>
      <p class="text-lg text-body">
        {{ t('error.noAccess') }}
        <template v-if="currentUser?.email">
          {{ t('error.noAccessSignedInAs', { email: currentUser.email }) }}
        </template>
      </p>
      <a
        href="https://maps.fundermaps.com"
        class="text-md mt-2 font-semibold text-green-ink underline underline-offset-2"
      >
        {{ t('error.goToMaps') }}
      </a>
      <button
        v-if="currentUser"
        type="button"
        class="text-md font-semibold text-label underline underline-offset-2"
        @click="logoutRedirect()"
      >
        {{ t('error.signOut') }}
      </button>
    </div>
  </AuthWrapper>
</template>
