<script setup lang="ts">
import { computed } from 'vue'

import { TONE_SPARK, type Tone } from '@/services/tone'

/**
 * A bar sparkline, 22px tall.
 *
 * Bars rather than a line: at this size a polyline is a smudge, and the values
 * this charts are counts per day — discrete things, which bars say and a line
 * does not. Low-saturation fill so the KPI numeral above stays the hero.
 *
 * Renders nothing for an all-zero series. A row of full-height bars for
 * "nothing happened all week" would be a lie told in the most legible way
 * available.
 */
const props = withDefaults(defineProps<{ values: number[]; tone?: Tone }>(), { tone: 'neutral' })

const bars = computed(() => {
  const max = Math.max(...props.values)
  if (!Number.isFinite(max) || max <= 0) return []
  // Floor at 2px so a zero-day is still a tick on the axis rather than a gap.
  return props.values.map((v) => `${Math.max(2, Math.round((v / max) * 22))}px`)
})
</script>

<template>
  <span v-if="bars.length" class="flex h-[22px] items-end gap-[3px]" aria-hidden="true">
    <span
      v-for="(height, i) in bars"
      :key="i"
      class="w-[5px] rounded-xs"
      :class="TONE_SPARK[tone]"
      :style="{ height }"
    />
  </span>
</template>
