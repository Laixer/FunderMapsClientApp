<script setup lang="ts">
import { computed } from 'vue'

import { TONE_FILL, type Tone } from '@/services/tone'

/**
 * A thin completeness bar.
 *
 * Used wherever a count would be true but slow to read: how far an address is
 * filled, how far a phase has run, how this week's throughput compares. Always
 * accompanied by the number itself somewhere in the row — the bar is for the
 * glance, the number is for the answer.
 */
const props = withDefaults(
  defineProps<{
    /** 0–1. Clamped, so a bad ratio cannot paint outside its track. */
    value: number
    tone?: Tone
    /** 4px inside cards, 6px in the funnel rail. */
    size?: 'sm' | 'md'
    label?: string
  }>(),
  { tone: 'green', size: 'sm' },
)

const pct = computed(() => `${Math.round(Math.min(1, Math.max(0, props.value)) * 100)}%`)
</script>

<template>
  <div
    class="overflow-hidden rounded-full bg-divider"
    :class="size === 'md' ? 'h-1.5' : 'h-1'"
    role="progressbar"
    :aria-valuenow="Math.round(Math.min(1, Math.max(0, value)) * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label"
  >
    <div class="h-full rounded-full" :class="TONE_FILL[tone]" :style="{ width: pct }" />
  </div>
</template>
