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
  <!-- Never wider than the bar: a chip holding many kinds ran past it. The
       value is cut off then, and says itself in full on hover. -->
  <span
    class="text-base inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border border-blue-border bg-blue-tint py-[5px] pr-2 pl-2.5 text-blue-ink"
  >
    <span class="shrink-0 text-blue-soft">{{ label }}</span>
    <strong class="min-w-0 truncate font-semibold" :title="value">{{ value }}</strong>
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
