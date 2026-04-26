<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <main class="p-8">
    <h1 class="text-2xl text-blue-900">Rapport bekijken</h1>
    <p class="mt-3 text-grey-700">
      id: {{ route.params.id }} · pagina: {{ route.params.page ?? 1 }}
    </p>
  </main>
</template>
