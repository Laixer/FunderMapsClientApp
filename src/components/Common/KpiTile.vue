<script setup lang="ts">
import Sparkline from '@/components/Common/Sparkline.vue'
import { TONE_DOT, type Tone } from '@/services/tone'

/**
 * One number, big enough to read from across the desk.
 *
 * The numeral is Outfit at 30px with tight tracking — it is the only thing on
 * the Werkbank that is allowed to be large, because it is the only thing you
 * come to that page to find out. The caption above it says which number, the
 * line beside it says what it is doing.
 *
 * Clicking a tile navigates to the explorer with that filter already applied:
 * a count you cannot open is trivia.
 */
withDefaults(
  defineProps<{
    label: string
    value: string | number
    /** What the number is doing. Only ever a fact we can actually derive. */
    caption?: string | null
    tone?: Tone
    /** Real history, when we have it. Absent renders no chart rather than a flat line. */
    history?: number[] | null
    loading?: boolean
  }>(),
  { tone: 'neutral', loading: false },
)
</script>

<template>
  <button
    type="button"
    class="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left hover:border-line-hover"
  >
    <span class="flex items-center gap-2">
      <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full" :class="TONE_DOT[tone]" />
      <span class="text-sm font-bold tracking-[0.05em] text-subtle uppercase">{{ label }}</span>
    </span>

    <span class="flex items-end gap-2">
      <span
        class="text-6xl font-display font-bold text-ink"
        :class="loading && 'animate-pulse text-line'"
      >
        {{ loading ? '—' : value }}
      </span>
      <span v-if="caption && !loading" class="text-sm pb-1 text-faint">{{ caption }}</span>
    </span>

    <Sparkline v-if="history?.length" :values="history" :tone="tone" />
  </button>
</template>
