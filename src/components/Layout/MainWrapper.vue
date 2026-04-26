<script setup lang="ts">
import Header from '@/components/Layout/Header.vue'
</script>

<template>
  <div class="page-dashboard">
    <Header />

    <div class="app-view | grid grid-flow-row-dense grid-cols-3 gap-3 bg-grey-100 px-3 py-3">
      <slot />
    </div>
  </div>
</template>
