<script setup lang="ts">
import { onMounted } from 'vue'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()

onMounted(async () => {
  await sessionStore.logoutAndRedirect()
})
</script>

<template>
  <main class="grid min-h-screen place-items-center" />
</template>
