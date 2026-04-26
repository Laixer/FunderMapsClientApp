<script setup lang="ts">
import { useRoute } from 'vue-router'
import MainWrapper from '@/components/Layout/MainWrapper.vue'

const route = useRoute()
</script>

<template>
  <MainWrapper>
    <main class="col-span-3 mt-16 p-8">
      <h1 class="text-2xl text-blue-900">Rapport bekijken</h1>
      <p class="mt-3 text-grey-700">
        id: {{ route.params.id }} · pagina: {{ route.params.page ?? 1 }}
      </p>
    </main>
  </MainWrapper>
</template>
