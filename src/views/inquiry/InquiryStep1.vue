<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <main class="p-8">
    <h1 class="text-2xl text-blue-900">Rapport — gegevens (stap 1)</h1>
    <p class="mt-3 text-grey-700">id: {{ route.params.id ?? '(nieuw)' }}</p>
  </main>
</template>
