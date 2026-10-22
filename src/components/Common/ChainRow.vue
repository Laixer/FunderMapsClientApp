<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { ChainStep, StepState } from '@/services/dossierChain'

/**
 * A road as one row of steps (2026-10-22): the dossier's from document to
 * FunderMaps (DossierChain), and a rapportage's back to where it came from
 * (RapportageOrigin). One look for both: green passed, amber where you are,
 * grey where it stopped, a hollow dot for what it has not reached; every
 * state also in words for a screen reader.
 *
 * The last column is a little wider: its value is the longest ("Rapportage
 * #31250 · 4 samples").
 */
const props = withDefaults(
  defineProps<{
    steps: ChainStep[]
    label: string
    /** What "here" means on this page, for a screen reader. */
    nowWord?: string
    /** Inside a page's own padding instead of a full-width band under a header. */
    inset?: boolean
    /**
     * Value and detail on two lines: for a row with less width per step (the
     * rapportage page shares its width with a side column), where height is cheaper.
     */
    stacked?: boolean
  }>(),
  { nowWord: 'hier staat het dossier nu', inset: false, stacked: false },
)

const DOT: Record<StepState, string> = {
  done: 'border-green-ink bg-green-ink',
  now: 'border-amber-ink bg-amber-ink ring-[3px] ring-amber-tint',
  stop: 'border-label bg-label',
  todo: 'border-line-hover bg-surface',
}
const word = computed<Record<StepState, string>>(() => ({
  done: 'gedaan',
  now: props.nowWord,
  stop: 'hier gestopt',
  todo: 'nog niet bereikt',
}))

/** The line to the next step is green once the road got that far. */
const reached = (s: ChainStep | undefined) => !!s && s.state !== 'todo'

const columns = computed(
  () => `repeat(${Math.max(props.steps.length - 1, 0)},minmax(0,1fr)) minmax(0,1.3fr)`,
)
</script>

<template>
  <ol
    class="grid shrink-0 bg-surface"
    :class="inset ? 'rounded-xl border border-line px-4 py-2' : 'border-b border-line px-6 py-2'"
    :style="{ gridTemplateColumns: columns }"
    :aria-label="label"
  >
    <li
      v-for="(step, i) in steps"
      :key="step.key"
      class="flex min-w-0 flex-col gap-0.5 pr-3 last:pr-0"
      :aria-current="step.state === 'now' ? 'step' : undefined"
    >
      <span class="flex items-center gap-2">
        <span
          class="h-2.5 w-2.5 shrink-0 rounded-full border-2"
          :class="DOT[step.state]"
          :title="word[step.state]"
        />
        <span class="sr-only">{{ word[step.state] }}:</span>
        <span class="text-2xs shrink-0 font-bold tracking-[0.08em] text-label uppercase">{{ step.label }}</span>
        <span
          v-if="i < steps.length - 1"
          aria-hidden="true"
          class="h-px min-w-3 flex-1"
          :class="reached(steps[i + 1]) ? 'bg-green-ink/50' : 'bg-line'"
        />
      </span>
      <!-- Value and its detail on one line by default: three lines made the
           dossier page's row 72px high, where every pixel of height goes to the
           document. Stacked, the detail gets a line of its own. -->
      <span
        class="pl-[18px] text-md min-w-0 truncate"
        :title="step.title ?? (step.sub ? `${step.value} · ${step.sub}` : step.value)"
      >
        <span class="font-semibold" :class="step.state === 'todo' ? 'text-faint' : 'text-ink'">
          <RouterLink v-if="step.link" :to="step.link" class="hover:underline">{{ step.value }}</RouterLink>
          <template v-else>{{ step.value }}</template>
        </span>
        <span v-if="step.sub && !stacked" class="text-sm text-faint"> · {{ step.sub }}</span>
      </span>
      <span v-if="step.sub && stacked" class="pl-[18px] text-sm min-w-0 truncate text-faint" :title="step.sub">
        {{ step.sub }}
      </span>
    </li>
  </ol>
</template>
