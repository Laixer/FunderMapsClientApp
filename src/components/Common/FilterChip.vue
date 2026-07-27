<script setup lang="ts">
/**
 * An active part of the question, shown as `key: value ×`.
 *
 * Filters that live only inside a dropdown are filters people forget they set,
 * and then report the list as broken. A chip per filter — and per sort, which
 * has the same problem — makes the current question visible and removable in
 * one click.
 */
defineProps<{ label: string; value: string }>()

defineEmits<{ remove: [] }>()
</script>

<template>
  <span
    class="text-base inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-border bg-blue-tint py-[5px] pr-2 pl-2.5 text-blue-ink"
  >
    <span class="text-blue-soft">{{ label }}</span>
    <strong class="font-semibold">{{ value }}</strong>
    <button
      type="button"
      class="ml-0.5 leading-none text-blue-soft hover:text-blue-ink"
      :aria-label="`${label} verwijderen`"
      @click="$emit('remove')"
    >
      ×
    </button>
  </span>
</template>
