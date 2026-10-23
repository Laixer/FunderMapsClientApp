<script setup lang="ts">
import { computed } from 'vue'

import { TONE_DOT, TONE_FILL, type Tone } from '@/services/tone'

/**
 * The Studio's column chart (2026-10-23): counts along time, one column per
 * month or year, stacked when there is more than one series. Made for the
 * Grafana boards moving in (Terugmeldingen per jaar, Datakwaliteit), so every
 * chart of that kind speaks one language.
 *
 * - A legend only for two or more series; a single series is named by its panel.
 * - Direct labels on the columns the caller marks (`labelled`) — the peak, this
 *   month — never a number on every column.
 * - Every column carries its own sentence (`describe`) as its accessible name
 *   and tooltip: the chart is also a list a screen reader can walk.
 * - Thin marks: 4px rounded tops (2px when the columns are narrow), 2px gaps
 *   between stacked segments, anchored to the baseline.
 */
export interface ChartColumn {
  key: string
  /** Under the column: a year, a month; empty for most of them. */
  tick?: string
  /** One per series, in the order of `series`, bottom up. */
  values: number[]
  /** The column in a sentence: "2023: 487 via het incidentportaal". */
  describe: string
  /** Show the total above it. */
  labelled?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: ChartColumn[]
    series: { label: string; tone: Tone }[]
    /** The list's accessible name. */
    label: string
    /** Height of the tallest column, in px. */
    height?: number
  }>(),
  { height: 112 },
)

const nl = (n: number) => n.toLocaleString('nl-NL')
const sum = (a: number[]) => a.reduce((n, x) => n + x, 0)
/** Beyond ~40 columns they are a few px wide: tighter gaps, smaller rounding. */
const dense = computed(() => props.columns.length > 40)

const bars = computed(() => {
  const max = Math.max(1, ...props.columns.map((c) => sum(c.values)))
  return props.columns.map((c) => {
    const segs = c.values
      .map((v, i) => ({ i, px: v > 0 ? Math.max(2, Math.round((v / max) * props.height)) : 0 }))
      .filter((s) => s.px > 0)
    return { ...c, total: sum(c.values), segs }
  })
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="series.length > 1" class="text-sm flex items-center gap-4 text-muted" aria-hidden="true">
      <span v-for="s in series" :key="s.label" class="flex items-center gap-1.5">
        <span class="size-2 rounded-full" :class="TONE_DOT[s.tone]" />{{ s.label }}
      </span>
    </div>
    <ol class="flex items-end" :class="dense ? 'gap-px' : 'gap-1.5'" role="list" :aria-label="label">
      <li
        v-for="c in bars"
        :key="c.key"
        class="flex min-w-0 flex-1 flex-col items-center gap-1"
        :aria-label="c.describe"
        :title="c.describe"
      >
        <span class="text-xs h-4 font-mono tabular-nums whitespace-nowrap text-muted" aria-hidden="true">{{
          c.labelled ? nl(c.total) : ''
        }}</span>
        <span
          class="flex w-full max-w-[28px] flex-col-reverse gap-[2px]"
          :style="{ height: `${height}px` }"
          aria-hidden="true"
        >
          <span
            v-for="(s, idx) in c.segs"
            :key="s.i"
            class="w-full shrink-0"
            :class="[TONE_FILL[series[s.i]?.tone ?? 'neutral'], idx === c.segs.length - 1 ? (dense ? 'rounded-t-[2px]' : 'rounded-t-[4px]') : '']"
            :style="{ height: `${s.px}px` }"
          />
        </span>
        <span class="text-xs h-4 font-mono tabular-nums whitespace-nowrap text-faint" aria-hidden="true">{{ c.tick ?? '' }}</span>
      </li>
    </ol>
  </div>
</template>
