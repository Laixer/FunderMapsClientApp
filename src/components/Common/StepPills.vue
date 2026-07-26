<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

export interface WizardStep {
  label: string
  /** Omit to render the step as inert — a step you cannot reach yet. */
  to?: RouteLocationRaw
}

/**
 * The wizard's three steps, as pills in the sub-header.
 *
 * Deliberately small and inline rather than a full-width stepper: in the old
 * app the stepper was the largest thing on the page, which is backwards — it is
 * orientation, not content. Green marks where you are, blue marks a step that
 * has been through, grey a step still ahead.
 */
const props = withDefaults(
  defineProps<{
    steps: WizardStep[]
    /** 1-indexed. */
    current: number
    /** Hairline connectors between pills. Used on step 1, dropped in Invoer. */
    connected?: boolean
  }>(),
  { connected: false },
)

type PillState = 'done' | 'current' | 'todo'

const states = computed<PillState[]>(() =>
  props.steps.map((_, i) => {
    const n = i + 1
    if (n === props.current) return 'current'
    return n < props.current ? 'done' : 'todo'
  }),
)

const PILL: Record<PillState, string> = {
  current: 'bg-green-wash border-green-border text-green-deep',
  done: 'bg-blue-tint border-blue-border text-blue-ink',
  todo: 'bg-surface border-line text-subtle',
}
</script>

<template>
  <ol class="flex items-center">
    <li v-for="(step, i) in steps" :key="step.label" class="flex items-center">
      <component
        :is="step.to ? RouterLink : 'span'"
        :to="step.to"
        class="text-base flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] font-semibold"
        :class="[PILL[states[i]!], step.to && 'hover:border-line-hover']"
        :aria-current="states[i] === 'current' ? 'step' : undefined"
      >
        <span class="text-2xs font-mono">{{ i + 1 }}</span>
        {{ step.label }}
      </component>
      <span
        v-if="connected && i < steps.length - 1"
        aria-hidden="true"
        class="h-px w-[18px]"
        :class="states[i] === 'todo' ? 'bg-line' : 'bg-green-border'"
      />
      <span v-else-if="i < steps.length - 1" aria-hidden="true" class="w-1.5" />
    </li>
  </ol>
</template>
