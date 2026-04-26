<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <div class="flex items-center gap-2 text-sm text-grey-700">
    <span class="spinner" aria-hidden="true" />
    <span>{{ label ?? 'Laden…' }}</span>
  </div>
</template>

<style scoped>
.spinner {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid theme(colors.grey.200);
  border-top-color: theme(colors.green.500);
  animation: spin 700ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
