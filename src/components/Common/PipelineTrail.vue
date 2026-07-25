<script setup lang="ts">
import { computed } from 'vue'

import Icon from '@/components/Common/Icon.vue'
import {
  STAGES,
  position,
  stageState,
  type Position,
  type Stage,
  type StageRole,
  type StageState,
} from '@/services/pipeline'

/**
 * Where a dossier stands, as a rail of stages.
 *
 * Each stage names the person responsible for it, which is the part a status
 * pill cannot express: "Te controleren" is a fact about the dossier, "Ton wacht
 * op controle" is a fact about the day.
 */
const props = defineProps<{
  status: number | null | undefined
  /** Who holds each stage. Rendered under its node; `null` reads as unassigned. */
  people?: Partial<Record<StageRole, string | null>>
}>()

const pos = computed<Position>(() => position(props.status))

const states = computed<StageState[]>(() => STAGES.map((_, i) => stageState(i, pos.value)))

/**
 * The connector *into* stage `i` is coloured once the stage before it is
 * behind us — so the line tracks progress rather than the node it points at.
 */
function segmentClass(i: number): string {
  return states.value[i - 1] === 'done' ? 'bg-green-500' : 'bg-grey-200'
}

const NODE_CLASSES: Record<StageState, string> = {
  done: 'border-green-500 bg-green-500 text-white',
  current: 'border-green-500 bg-white text-green-700',
  blocked: 'border-red-400 bg-red-50 text-red-800',
  todo: 'border-grey-200 bg-white text-grey-400',
}

const LABEL_CLASSES: Record<StageState, string> = {
  done: 'text-grey-800',
  current: 'text-grey-800',
  blocked: 'text-red-800',
  todo: 'text-grey-700',
}

function personFor(stage: Stage): string | null {
  if (!stage.role) return null
  return props.people?.[stage.role] ?? null
}

/**
 * A closed-out dossier never reached the finish line, so colouring the rail
 * would overstate it. Grey the whole thing and let the caption carry the fact.
 */
const isClosed = computed(() => pos.value.closed)
</script>

<template>
  <div>
    <ol class="flex items-start" :class="isClosed && 'opacity-50 grayscale'">
      <li v-for="(stage, i) in STAGES" :key="stage.key" class="min-w-0 flex-1">
        <div class="flex items-center">
          <!-- Half-width stubs at the ends keep every node centred over its own
               column, so the labels below line up with the nodes above. -->
          <span
            aria-hidden="true"
            class="h-0.5 flex-1 rounded-full"
            :class="i === 0 ? 'bg-transparent' : segmentClass(i)"
          />
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors"
            :class="NODE_CLASSES[states[i]]"
            :title="stage.summary"
          >
            <Icon v-if="states[i] === 'done'" name="check" size="xs" />
            <Icon v-else-if="states[i] === 'blocked'" name="alert" size="xs" />
            <!-- Current: a solid pip inside the ring. Upcoming: its number, so
                 an untouched rail still reads as an ordered sequence. -->
            <span
              v-else-if="states[i] === 'current'"
              class="h-2.5 w-2.5 rounded-full bg-green-500"
              aria-hidden="true"
            />
            <span v-else class="text-xs font-semibold">{{ i + 1 }}</span>
          </span>
          <span
            aria-hidden="true"
            class="h-0.5 flex-1 rounded-full"
            :class="i === STAGES.length - 1 ? 'bg-transparent' : segmentClass(i + 1)"
          />
        </div>

        <div class="mt-2 px-1 text-center">
          <p class="truncate text-sm font-semibold" :class="LABEL_CLASSES[states[i]]">
            {{ stage.label }}
          </p>
          <p
            v-if="personFor(stage)"
            class="text-grey-700 truncate text-xs"
            :title="personFor(stage)!"
          >
            {{ personFor(stage) }}
          </p>
          <p v-else-if="stage.role" class="text-grey-400 truncate text-xs italic">
            niet toegewezen
          </p>
        </div>
      </li>
    </ol>

    <p v-if="isClosed" class="text-grey-700 mt-3 text-center text-xs">
      Afgevallen — dit dossier is afgesloten zonder te zijn vastgesteld.
    </p>
    <p v-else-if="pos.returned" class="mt-3 text-center text-xs text-red-800">
      Teruggestuurd door de beoordelaar.
    </p>
  </div>
</template>
