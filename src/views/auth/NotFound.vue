<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AuthWrapper from '@/components/Layout/AuthWrapper.vue'

const { t } = useI18n()
</script>

<template>
  <AuthWrapper title="404">
    <div
      class="flex w-full max-w-md flex-col items-center gap-2 rounded-2xl border border-line bg-surface px-8 py-7 text-center"
    >
      <p class="font-mono text-2xl text-label">404</p>
      <p class="text-lg text-body">{{ t('error.pageNotFound') }}</p>
      <RouterLink
        :to="{ name: 'home' }"
        class="text-md mt-2 font-semibold text-green-ink underline underline-offset-2"
      >
        {{ t('error.backToOverview') }}
      </RouterLink>
    </div>
  </AuthWrapper>
</template>
