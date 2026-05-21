<script setup lang="ts">
import { onMounted } from 'vue'
import { logoutRedirect } from '@/services/oidc'

// RP-initiated logout: clear local tokens and end the SSO session at the
// provider (/oauth2/end-session), then land back on /login for a fresh login
// (option B). A local-only logout would silently re-login via the still-alive
// SSO session.
onMounted(() => {
  logoutRedirect()
})
</script>

<template>
  <main class="grid min-h-screen place-items-center" />
</template>
