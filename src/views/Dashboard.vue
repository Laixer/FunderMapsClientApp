<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'

const { t } = useI18n()
const sessionStore = useSessionStore()
</script>

<template>
  <main class="space-y-4 p-8">
    <h1 class="text-2xl text-blue-900">{{ t('nav.dashboard') }}</h1>
    <p class="text-grey-700">
      Ingelogd als {{ sessionStore.currentUser?.email }}.
    </p>
    <RouterLink :to="{ name: 'logout' }" class="text-green-700 underline">
      {{ t('auth.logout') }}
    </RouterLink>
  </main>
</template>
