<script setup lang="ts">
import Sidebar from '@/components/Layout/Sidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-grey-100">
    <Sidebar />
    <main class="ml-56 min-h-screen p-8">
      <slot />
    </main>
  </div>
</template>
