<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'
import MainWrapper from '@/components/Layout/MainWrapper.vue'

const { t } = useI18n()
const sessionStore = useSessionStore()
const { currentUser } = storeToRefs(sessionStore)
</script>

<template>
  <MainWrapper>
    <main class="col-span-3 mt-16 space-y-4 p-8">
      <h1 class="text-2xl text-blue-900">{{ t('nav.dashboard') }}</h1>
      <p class="text-grey-700">Ingelogd als {{ currentUser?.email }}.</p>
    </main>
  </MainWrapper>
</template>
