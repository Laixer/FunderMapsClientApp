<script setup lang="ts">
import StepPills, { type WizardStep } from '@/components/Common/StepPills.vue'

/**
 * The sub-header every wizard step wears: what you are editing, where you are
 * in the flow, and the way forward — all on one 56px line.
 *
 * The actions live here rather than in a sticky footer bar. A footer puts
 * "Volgende" at the bottom of a form you have to scroll past to reach it, and
 * puts it a screen away from the step pills that say what "next" means.
 *
 * The mono status line under the title is the honest bit: `concept · nog niet
 * opgeslagen` and `opgeslagen 12:04` are the difference between trusting the
 * app with an afternoon's typing and not.
 */
defineProps<{
  title: string
  /** Mono line under the title: draft state, autosave stamp, dossier id. */
  status?: string
  steps: WizardStep[]
  current: number
  connected?: boolean
}>()
</script>

<template>
  <header
    class="flex shrink-0 items-center gap-3.5 border-b border-line bg-surface px-6 py-3"
  >
    <div class="flex min-w-0 flex-col gap-0.5">
      <h1 class="text-2xl truncate font-display font-bold text-ink">{{ title }}</h1>
      <p v-if="status" class="text-xs font-mono text-faint">{{ status }}</p>
    </div>

    <div class="ml-4">
      <StepPills :steps="steps" :current="current" :connected="connected" />
    </div>

    <div class="ml-auto flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
