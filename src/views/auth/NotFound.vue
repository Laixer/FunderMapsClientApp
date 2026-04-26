<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthWrapper from '@/components/Layout/AuthWrapper.vue'

const { t } = useI18n()
</script>

<template>
  <AuthWrapper title="404">
    <div class="card w-full max-w-md space-y-3 rounded-lg bg-white p-8 text-center shadow-card">
      <h2 class="text-2xl text-blue-900">404</h2>
      <p class="text-grey-700">{{ t('error.pageNotFound') }}</p>
      <RouterLink :to="{ name: 'dashboard' }" class="text-green-700 underline">
        {{ t('error.backToDashboard') }}
      </RouterLink>
    </div>
  </AuthWrapper>
</template>
