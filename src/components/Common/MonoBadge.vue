<script setup lang="ts">
withDefaults(defineProps<{ value: string | number; title?: string }>(), {
  title: '',
})
</script>

<template>
  <span
    class="inline-flex max-w-full items-center truncate rounded bg-grey-100 px-1.5 py-0.5 font-mono text-xs text-grey-800"
    :title="title || String(value)"
  >
    {{ value }}
  </span>
</template>
