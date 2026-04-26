<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { setUnauthorizedHandler } from '@/services/fundermaps/client'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

onMounted(() => {
  setUnauthorizedHandler(() => {
    // Server says our bearer is dead. Clear local session and bounce to
    // login. Best-effort — if logout itself errors, still navigate.
    sessionStore.logout().finally(() => {
      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' })
      }
    })
  })
})
</script>

<template>
  <RouterView />
</template>

<style>
.page-dashboard {
  max-height: 100vh;
}

.List {
  margin: 2rem;
}

.Details {
  margin: 2rem;
  margin-left: 0;
}

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
