<script setup lang="ts">
import { onMounted } from 'vue'

import { logoutRedirect } from '@/services/auth'

// Ends the session at the API (clears the cookie) and lands on the auth app's
// login page.
onMounted(() => {
  void logoutRedirect()
})
</script>

<template>
  <main class="grid min-h-screen place-items-center" />
</template>
