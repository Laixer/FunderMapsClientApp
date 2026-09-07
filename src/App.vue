<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { setUnauthorizedHandler } from '@/services/fundermaps/client'
import { loginRedirect } from '@/services/auth'


onMounted(() => {
  setUnauthorizedHandler(() => {
    // Server says the session is gone: go and log in again; the auth app
    // brings the user back to this page.
    loginRedirect()
  })
})
</script>

<template>
  <RouterView />
</template>

<style>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.short-enter-active,
.short-leave-active {
  transition: opacity 0.25s ease;
}

.v-enter-from,
.v-leave-to,
.short-enter-from,
.short-leave-to {
  opacity: 0;
}
</style>
