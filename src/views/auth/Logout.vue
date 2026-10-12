<script setup lang="ts">
import { onMounted } from 'vue'

import AuthWrapper from '@/components/Layout/AuthWrapper.vue'
import { logoutRedirect } from '@/services/auth'

// Ends the session at the API (clears the cookie) and lands on the auth app's
// login page.
onMounted(() => {
  void logoutRedirect()
})
</script>

<template>
  <!-- Said in words: the sign-out takes a moment, and a blank white page looks broken. -->
  <AuthWrapper title="Uitloggen">
    <p class="text-lg text-center text-muted">Je wordt uitgelogd…</p>
  </AuthWrapper>
</template>
