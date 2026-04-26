<script setup lang="ts">
import { RouterView } from 'vue-router'
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
