<script setup lang="ts">
import { computed } from 'vue'

import ProgressBar from '@/components/Common/ProgressBar.vue'
import {
  STAGES,
  position,
  stageState,
  type Position,
  type StageRole,
  type StageState,
} from '@/services/pipeline'
import type { Tone } from '@/services/tone'

/**
 * The dossier's three phases as three equal cards.
 *
 * Replaces the wide connected stepper. A stepper draws a rail and hangs labels
 * off it, which spends most of its width on the rail; three cards spend it on
 * the thing you actually want per phase — who owns it, and how far it got.
 *
 * `progress` is supplied by the caller because only the caller can count it
 * (filled fields per address, for the entry phase). Nothing is invented here:
 * a phase with no measurable progress renders an empty track.
 */
const props = defineProps<{
  status: number | null | undefined
  /** Who holds each stage; `null` reads as unassigned. */
  people?: Partial<Record<StageRole, string | null>>
  /** 0–1 per stage, same order as `STAGES`. Absent entries render empty. */
  progress?: Array<number | null>
}>()

const pos = computed<Position>(() => position(props.status))
const states = computed<StageState[]>(() => STAGES.map((_, i) => stageState(i, pos.value)))

const CARD: Record<StageState, string> = {
  done: 'bg-green-wash border-green-border',
  current: 'bg-green-wash border-green-border',
  blocked: 'bg-red-tint border-red-border',
  todo: 'bg-surface border-line',
}

const CHIP: Record<StageState, string> = {
  done: 'bg-green text-white',
  current: 'bg-green text-white',
  blocked: 'bg-red text-white',
  todo: 'bg-canvas text-subtle',
}

const TITLE: Record<StageState, string> = {
  done: 'text-green-deep',
  current: 'text-green-deep',
  blocked: 'text-red',
  todo: 'text-muted',
}

const BAR: Record<StageState, Tone> = {
  done: 'green',
  current: 'green',
  blocked: 'red',
  todo: 'neutral',
}

/**
 * A stage that is behind us is complete by definition; a stage still ahead is
 * empty by definition. Only the one you are standing on needs a real number,
 * and that is the only one the caller is asked to measure.
 */
function fillFor(index: number): number {
  const state = states.value[index]
  if (state === 'done') return 1
  if (state === 'todo') return 0
  return props.progress?.[index] ?? 0
}

function personFor(index: number): string | null {
  const role = STAGES[index]!.role
  if (!role) return null
  return props.people?.[role] ?? null
}
</script>

<template>
  <ol class="grid grid-cols-3 gap-2.5">
    <li
      v-for="(stage, i) in STAGES"
      :key="stage.key"
      class="flex flex-col gap-2 rounded-xl border px-3.5 py-3"
      :class="CARD[states[i]!]"
      :title="stage.summary"
    >
      <div class="flex items-center gap-2">
        <span
          class="text-2xs inline-flex h-[18px] w-[18px] items-center justify-center rounded-full font-mono"
          :class="CHIP[states[i]!]"
          aria-hidden="true"
        >
          {{ i + 1 }}
        </span>
        <span class="text-lg font-bold" :class="TITLE[states[i]!]">{{ stage.label }}</span>
      </div>

      <span class="text-sm truncate text-subtle" :title="personFor(i) ?? undefined">
        <template v-if="personFor(i)">{{ personFor(i) }}</template>
        <template v-else-if="stage.role">niet toegewezen</template>
        <template v-else>{{ states[i] === 'done' ? 'vastgesteld' : 'wacht op controle' }}</template>
      </span>

      <ProgressBar :value="fillFor(i)" :tone="BAR[states[i]!]" :label="stage.label" />
    </li>
  </ol>
</template>
