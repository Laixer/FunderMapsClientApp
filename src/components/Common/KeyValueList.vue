<script setup lang="ts">
export interface KeyValueItem {
  label: string
  value: string | number | null | undefined
  /** IDs, dates and measurements line up when they share a face. */
  mono?: boolean
}

/**
 * A fixed-ratio key/value grid with hairline dividers.
 *
 * The keys column is a percentage rather than a fixed width so the same
 * component works in a 380px inspector and in a half-width details card
 * without either one wrapping its labels.
 */
withDefaults(
  defineProps<{
    items: KeyValueItem[]
    /** Width of the key column. 44% in cards, 46% in the narrower inspector. */
    ratio?: string
    /** Placeholder for a missing value. An em dash, not a blank. */
    fallback?: string
  }>(),
  { ratio: '44%', fallback: '—' },
)
</script>

<template>
  <dl class="text-md">
    <div
      v-for="item in items"
      :key="item.label"
      class="grid gap-2.5 border-b border-canvas py-2 last:border-b-0"
      :style="{ gridTemplateColumns: `${ratio} 1fr` }"
    >
      <dt class="text-subtle">{{ item.label }}</dt>
      <dd class="min-w-0 font-medium break-words text-body" :class="item.mono && 'font-mono'">
        {{ item.value === null || item.value === undefined || item.value === '' ? fallback : item.value }}
      </dd>
    </div>
  </dl>
</template>
