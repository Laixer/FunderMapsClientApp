<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import AuthWrapper from '@/components/Layout/AuthWrapper.vue'
import { loginRedirect } from '@/services/oidc'

// Login now lives in the dedicated auth app (auth.fundermaps.com). This route
// is just the entry point: it kicks off the OIDC authorization-code flow and
// hands off to the auth app. The guard routes unauthenticated users here, and
// logout returns here too.
const { t } = useI18n()

onMounted(() => {
  loginRedirect()
})
</script>

<template>
  <AuthWrapper :title="t('app.title')">
    <p class="text-sm text-grey-700">{{ t('common.loading') }}</p>
  </AuthWrapper>
</template>
