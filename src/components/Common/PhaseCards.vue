<script setup lang="ts">
import { computed } from 'vue'

import ChainRow from '@/components/Common/ChainRow.vue'
import type { ChainStep, StepState } from '@/services/dossierChain'
import {
  STAGES,
  position,
  stageState,
  type Position,
  type StageRole,
  type StageState,
} from '@/services/pipeline'

/**
 * The dossier's three phases — Invoer, Controle, Afgerond — in the Studio's one
 * progress language (2026-10-22): a ChainRow, dots joined by a line, like the
 * origin row right above it on the rapportage page and the chain on a dossier.
 * Three big cards there spoke a second language for the same idea.
 *
 * Per phase: who holds it, and for the phase you are standing on how far it got.
 * `progress` is supplied by the caller because only the caller can count it
 * (filled fields per address, for the entry phase). Nothing is invented here:
 * a phase without a number says none.
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

/**
 * The pipeline's stage states in the chain's words. Sent back is where it is now
 * (with the opsteller), not a stop: on the dossier chain grey "stop" means closed.
 * The "teruggestuurd" under it, the red callout and the status badge say why.
 */
const STEP: Record<StageState, StepState> = { done: 'done', current: 'now', blocked: 'now', todo: 'todo' }

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

const steps = computed<ChainStep[]>(() =>
  STAGES.map((stage, i) => {
    const state = states.value[i]!
    const fill = fillFor(i)
    return {
      key: stage.key,
      label: stage.label,
      // "wacht op controle" only while it is with the reviewer: it also said so on a
      // dossier that was sent back, or not started, and so waits for the opsteller.
      value:
        personFor(i) ??
        (stage.role
          ? 'niet toegewezen'
          : state === 'done'
            ? 'vastgesteld'
            : pos.value.index === 1
              ? 'wacht op controle'
              : 'nog niet vastgesteld'),
      sub:
        (state === 'current' || state === 'blocked') && fill > 0 && fill < 1
          ? `${Math.round(fill * 100)}% ingevuld`
          : state === 'blocked'
            ? 'teruggestuurd'
            : null,
      state: STEP[state],
      title: stage.summary,
    }
  }),
)
</script>

<template>
  <ChainRow :steps="steps" label="Voortgang" now-word="hier staat het nu" inset stacked />
</template>
