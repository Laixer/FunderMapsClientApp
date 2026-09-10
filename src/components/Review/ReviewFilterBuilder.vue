<script setup lang="ts">
import { computed, ref } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'

import type {
  QueueChannel,
  QueueOutcome,
  QueueSort,
  QueueState,
} from '@/services/fundermaps/endpoints/dataops'
import {
  BUILDING_OPTIONS,
  CHANNEL_OPTIONS,
  KIND_OPTIONS,
  OUTCOME_OPTIONS,
  SORT_OPTIONS,
  STATE_OPTIONS,
  isDefaultSort,
  sortOption,
  type ReviewQuery,
} from '@/services/reviewExplorer'

/**
 * The review queue's `Filteren & sorteren` popover — the Rapportages one, on
 * the dossier's own vocabulary. Same rules: sets are multi-select and apply
 * immediately, the sort is single-choice below a rule, and the direction is
 * named in the column's own words.
 */
const props = defineProps<{ query: ReviewQuery }>()
const emit = defineEmits<{ update: [query: ReviewQuery] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

const setState = (v: QueueState) =>
  emit('update', { ...props.query, state: toggle(props.query.state, v), page: 1 })
const setChannel = (v: QueueChannel) =>
  emit('update', { ...props.query, channel: toggle(props.query.channel, v), page: 1 })
const setKind = (v: string) =>
  emit('update', { ...props.query, kind: toggle(props.query.kind, v), page: 1 })
const setOverdue = () => emit('update', { ...props.query, overdue: !props.query.overdue, page: 1 })
const setBuilding = (v: 'resolved' | 'unresolved') =>
  emit('update', { ...props.query, building: props.query.building === v ? null : v, page: 1 })
/**
 * Picking an outcome leaves the desk for the closed. The stand filters
 * (unread / empty / proposals) are about the desk and mean nothing there, so
 * they are dropped at the same time rather than left to combine into an
 * empty list nobody can explain.
 */
const setOutcome = (v: QueueOutcome) => {
  const outcome = toggle(props.query.outcome, v)
  emit('update', {
    ...props.query,
    outcome,
    state: outcome.length ? [] : props.query.state,
    overdue: outcome.length ? false : props.query.overdue,
    page: 1,
  })
}

/** Picking a column sorts it its natural way; picking it again flips the direction. */
function setSort(value: QueueSort) {
  const active = props.query.sort === value
  const natural = value === 'received_at' ? 'asc' : 'desc'
  emit('update', {
    ...props.query,
    sort: value,
    order: active ? (props.query.order === 'desc' ? 'asc' : 'desc') : natural,
    page: 1,
  })
}
const setOrder = (order: 'asc' | 'desc') => emit('update', { ...props.query, order, page: 1 })

const direction = computed(() => {
  const option = sortOption(props.query.sort)
  return [
    { value: 'asc' as const, label: option.asc },
    { value: 'desc' as const, label: option.desc },
  ]
})

const pill = (active: boolean) =>
  active
    ? 'border-blue-border bg-blue-tint text-blue-ink'
    : 'border-line bg-surface text-muted hover:border-line-hover'
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="text-base rounded-full border border-dashed border-line-strong bg-surface px-2.5 py-[5px] text-subtle hover:border-line-hover hover:text-strong"
      :aria-expanded="open"
      @click="open = !open"
    >
      Filteren &amp; sorteren
    </button>

    <div
      v-if="open"
      class="studio-fade absolute top-full left-0 z-30 mt-2 flex w-[440px] flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-overlay"
    >
      <section>
        <h3 class="studio-label mb-2">STAND</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="o in STATE_OPTIONS"
            :key="o.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="pill(query.state.includes(o.value))"
            @click="setState(o.value)"
          >
            {{ o.label }}
          </button>
          <button
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="pill(query.overdue)"
            @click="setOverdue"
          >
            Langer dan een week open
          </button>
        </div>
      </section>

      <section>
        <h3 class="studio-label mb-2">GESLOTEN</h3>
        <!-- Not the desk: dossiers a reviewer already closed, to check or
             to find again. Combines with via / pand / soort, not with stand. -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="o in OUTCOME_OPTIONS"
            :key="o.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="pill(query.outcome.includes(o.value))"
            @click="setOutcome(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="studio-label mb-2">VIA</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="o in CHANNEL_OPTIONS"
            :key="o.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="pill(query.channel.includes(o.value))"
            @click="setChannel(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="studio-label mb-2">PAND</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="o in BUILDING_OPTIONS"
            :key="o.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="pill(query.building === o.value)"
            @click="setBuilding(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="studio-label mb-2">SOORT DOCUMENT</h3>
        <!-- What the pipeline read it to be; empty on dossiers read before
             the model started saying (2026-09-07). Scrolls rather than growing
             the popover past the bar it hangs from. -->
        <div class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          <button
            v-for="o in KIND_OPTIONS"
            :key="o.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="pill(query.kind.includes(o.value))"
            @click="setKind(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
      </section>

      <section class="border-t border-divider pt-3.5">
        <h3 class="studio-label mb-2">SORTEREN OP</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="o in SORT_OPTIONS"
            :key="o.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="pill(query.sort === o.value)"
            :aria-pressed="query.sort === o.value"
            @click="setSort(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            v-for="o in direction"
            :key="o.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="pill(query.order === o.value)"
            :aria-pressed="query.order === o.value"
            @click="setOrder(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
        <p class="text-sm mt-2 text-label">
          Klik dezelfde kolom nog eens om de richting om te draaien.
          <template v-if="isDefaultSort(query)">Dit is de standaardvolgorde: de wachtrij, oudste eerst.</template>
        </p>
      </section>
    </div>
  </div>
</template>
