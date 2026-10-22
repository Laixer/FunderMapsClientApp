<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'

import { eventDate, LANES, lifelineSpan, yearOf, type StoryEvent } from '@/services/buildingStory'
import type { Tone } from '@/services/tone'

/**
 * The levenslijn (Pand page, 2026-10-22): everything that happened to a pand
 * on one time axis, one lane per kind — rapportages, herstel, dossiers, the
 * model. A dot's colour is its state (green: in FunderMaps / afgerond,
 * amber: open, blue: the model moved, grey: closed or other). Hover for what
 * it was; click to find it in the list below.
 *
 * Drawn 1:1 to its box (like the Datastroom), so text never stretches.
 */
const props = defineProps<{ events: StoryEvent[]; selected?: string | null }>()
const emit = defineEmits<{ select: [key: string] }>()

const box = useTemplateRef<HTMLElement>('box')
const { width } = useElementSize(box)

const LABEL_W = 104
const LANE_H = 26
const AXIS_H = 22
const PAD_R = 14
const HEIGHT = LANES.length * LANE_H + AXIS_H

const FILL: Record<Tone, string> = {
  green: 'fill-green',
  amber: 'fill-amber',
  blue: 'fill-blue',
  red: 'fill-red',
  neutral: 'fill-faint',
}

const span = computed(() => lifelineSpan(props.events))
const plotW = computed(() => Math.max(width.value - LABEL_W - PAD_R, 50))
const x = (year: number) => LABEL_W + ((year - span.value[0]) / (span.value[1] - span.value[0])) * plotW.value

/** Whole years along the axis; every second or fifth one when the span is long. */
const ticks = computed(() => {
  const [a, b] = span.value
  const n = b - a
  const step = n <= 12 ? 1 : n <= 30 ? 2 : 5
  const out: number[] = []
  for (let y = Math.ceil(a / step) * step; y <= b; y += step) out.push(y)
  return out
})

const marks = computed(() =>
  props.events.flatMap((e) => {
    const lane = LANES.findIndex((l) => l.kinds.includes(e.kind))
    if (lane < 0) return []
    return [{ e, cx: x(yearOf(e.date)), cy: lane * LANE_H + LANE_H / 2 }]
  }),
)

const hover = ref<{ e: StoryEvent; cx: number; cy: number } | null>(null)
const count = (kinds: string[]) => props.events.filter((e) => kinds.includes(e.kind)).length
</script>

<template>
  <div ref="box" class="relative w-full">
    <svg
      v-if="width"
      :width="width"
      :height="HEIGHT"
      :viewBox="`0 0 ${width} ${HEIGHT}`"
      role="img"
      :aria-label="`Levenslijn van het pand, ${span[0]} tot nu: ${events.length - (events.some((e) => e.kind === 'built') ? 1 : 0)} gebeurtenissen`"
      class="block"
    >
      <!-- lanes -->
      <g v-for="(l, i) in LANES" :key="l.label">
        <text :x="0" :y="i * LANE_H + LANE_H / 2 + 4" class="fill-muted text-[12px]">{{ l.label }}</text>
        <text :x="LABEL_W - 14" :y="i * LANE_H + LANE_H / 2 + 4" text-anchor="end" class="fill-faint font-mono text-[11px]">{{ count(l.kinds) }}</text>
        <line :x1="LABEL_W" :x2="LABEL_W + plotW" :y1="i * LANE_H + LANE_H / 2" :y2="i * LANE_H + LANE_H / 2" class="stroke-line" stroke-width="1" />
      </g>
      <!-- axis -->
      <g>
        <g v-for="t in ticks" :key="t">
          <line :x1="x(t)" :x2="x(t)" :y1="0" :y2="LANES.length * LANE_H" class="stroke-divider" stroke-width="1" />
          <text :x="x(t)" :y="HEIGHT - 6" text-anchor="middle" class="fill-faint font-mono text-[11px]">{{ t }}</text>
        </g>
      </g>
      <!-- marks: a 2px surface ring so overlapping dots stay apart -->
      <g
        v-for="m in marks"
        :key="m.e.key"
        role="button"
        tabindex="0"
        class="cursor-pointer outline-none"
        :aria-label="`${m.e.title}, ${eventDate(m.e)}`"
        @mouseenter="hover = m"
        @mouseleave="hover = null"
        @focus="hover = m"
        @blur="hover = null"
        @click="emit('select', m.e.key)"
        @keydown.enter.prevent="emit('select', m.e.key)"
      >
        <circle :cx="m.cx" :cy="m.cy" r="11" class="fill-transparent" />
        <circle
          :cx="m.cx"
          :cy="m.cy"
          :r="selected === m.e.key || hover?.e.key === m.e.key ? 6.5 : 5"
          :class="FILL[m.e.tone]"
          class="stroke-surface"
          stroke-width="2"
        />
      </g>
    </svg>
    <div
      v-if="hover"
      class="pointer-events-none absolute z-10 max-w-[320px] -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 shadow-sm"
      :style="{ left: `${Math.min(Math.max(hover.cx, 160), width - 160)}px`, top: `${hover.cy + 14}px` }"
      role="tooltip"
    >
      <p class="text-md font-semibold text-ink">{{ hover.e.title }}</p>
      <p class="text-sm text-muted">{{ eventDate(hover.e) }}<template v-if="hover.e.pill"> · {{ hover.e.pill.label }}</template></p>
    </div>
  </div>
</template>
