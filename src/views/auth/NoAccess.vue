<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AuthWrapper from '@/components/Layout/AuthWrapper.vue'
import { useSessionStore } from '@/stores/session'
import { logoutRedirect } from '@/services/auth'

const { t } = useI18n()
const { currentUser } = storeToRefs(useSessionStore())
</script>

<template>
  <AuthWrapper :title="t('error.noAccessTitle')">
    <div
      class="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-8 py-7 text-center"
    >
      <p class="font-mono text-2xl text-label">403</p>
      <p class="text-lg text-body">
        {{ t('error.noAccess', { email: currentUser?.email ?? '' }) }}
      </p>
      <a
        href="https://maps.fundermaps.com"
        class="text-md mt-2 font-semibold text-green-ink underline underline-offset-2"
      >
        {{ t('error.goToMaps') }}
      </a>
      <button
        type="button"
        class="text-md font-semibold text-label underline underline-offset-2"
        @click="logoutRedirect()"
      >
        {{ t('error.signOut') }}
      </button>
    </div>
  </AuthWrapper>
</template>
