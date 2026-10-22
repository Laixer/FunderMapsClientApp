<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { IReviewDossier, VerdictOutcome } from '@/services/fundermaps/interfaces/IDataops'
import { dossierChain, type ChainStep, type StepState } from '@/services/dossierChain'

/**
 * The dossier's road from document to FunderMaps, in one row under the header
 * (services/dossierChain.ts). The colours are the Datastroom's: green passed,
 * amber where the dossier is now, grey where it was closed, a hollow dot for
 * what it has not reached. Each step says its state in words as well.
 *
 * It follows the reviewer: a verdict given on this page moves "Beoordeeld"
 * at once, without reloading.
 */
const props = defineProps<{
  data: IReviewDossier
  decided: Record<number, VerdictOutcome>
  closedNow?: string | null
}>()

const steps = computed(() => dossierChain(props.data, props.decided, props.closedNow ?? null))

const DOT: Record<StepState, string> = {
  done: 'border-green-ink bg-green-ink',
  now: 'border-amber-ink bg-amber-ink ring-[3px] ring-amber-tint',
  stop: 'border-label bg-label',
  todo: 'border-line-hover bg-surface',
}
const STATE_WORD: Record<StepState, string> = {
  done: 'gedaan',
  now: 'hier staat het dossier nu',
  stop: 'hier gestopt',
  todo: 'nog niet bereikt',
}

/** The line to the next step is green once the dossier got that far. */
const reached = (s: ChainStep | undefined) => !!s && s.state !== 'todo'
</script>

<template>
  <ol
    class="grid shrink-0 grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,1.3fr)] border-b border-line bg-surface px-6 py-2"
    aria-label="Van document tot FunderMaps"
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
          :title="STATE_WORD[step.state]"
        />
        <span class="sr-only">{{ STATE_WORD[step.state] }}:</span>
        <span class="text-2xs shrink-0 font-bold tracking-[0.08em] text-label uppercase">{{ step.label }}</span>
        <span
          v-if="i < steps.length - 1"
          aria-hidden="true"
          class="h-px min-w-3 flex-1"
          :class="reached(steps[i + 1]) ? 'bg-green-ink/50' : 'bg-line'"
        />
      </span>
      <!-- Value and its detail on one line: three lines made the row 72px high
           on a screen where every pixel of height goes to the document. -->
      <span
        class="pl-[18px] text-md min-w-0 truncate"
        :title="step.sub ? `${step.value} · ${step.sub}` : step.value"
      >
        <span class="font-semibold" :class="step.state === 'todo' ? 'text-faint' : 'text-ink'">
          <RouterLink v-if="step.link" :to="step.link" class="hover:underline">{{ step.value }}</RouterLink>
          <template v-else>{{ step.value }}</template>
        </span>
        <span v-if="step.sub" class="text-sm text-faint"> · {{ step.sub }}</span>
      </span>
    </li>
  </ol>
</template>
