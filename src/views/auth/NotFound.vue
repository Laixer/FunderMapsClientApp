<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-grey-100 p-6">
    <div class="space-y-3 text-center">
      <h1 class="text-2xl text-blue-900">404</h1>
      <p class="text-grey-700">Pagina niet gevonden.</p>
      <RouterLink :to="{ name: 'dashboard' }" class="text-green-700 underline">
        Terug naar dashboard
      </RouterLink>
    </div>
  </main>
</template>
