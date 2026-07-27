<script setup lang="ts">
import { computed, ref } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'

import { INQUIRY_TYPE_LABELS, STATUS_META } from '@/services/inquiryEnums'
import {
  SORT_OPTIONS,
  isDefaultSort,
  sortOption,
  type ExplorerQuery,
  type SortField,
} from '@/services/explorer'

/**
 * The `+ Filter` popover.
 *
 * Multi-select on purpose: "te controleren óf afgekeurd" is a real question
 * people ask, and a single-choice dropdown cannot express it — which is why the
 * old list view had to smuggle two-status lanes past its own Select as an
 * undismissable chip. Here a status set is just a set.
 *
 * Everything applies immediately. There is no Apply button, because the result
 * count is right next to the popover and watching it move is the fastest way to
 * tell whether you asked the right question.
 *
 * Sorting lives here too, under a rule of its own — one column at a time,
 * unlike the filters above it. The table headers can already sort, but only on
 * the six columns that happen to be on screen and only by cycling
 * asc → desc → off, which is three clicks to say "op opsteller, Z → A". This
 * says it in two, names both directions, and covers the columns the table does
 * not show.
 */
const props = defineProps<{ query: ExplorerQuery }>()

const emit = defineEmits<{ update: [query: ExplorerQuery] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

const STATUSES = Object.entries(STATUS_META).map(([value, meta]) => ({
  value: Number(value),
  label: meta.label,
}))

const TYPES = Object.entries(INQUIRY_TYPE_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}))

function toggle(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function setStatus(value: number) {
  emit('update', { ...props.query, status: toggle(props.query.status, value), page: 1 })
}

function setType(value: number) {
  emit('update', { ...props.query, type: toggle(props.query.type, value), page: 1 })
}

function setMine(value: 'reviewer' | 'creator' | null) {
  emit('update', { ...props.query, mine: props.query.mine === value ? null : value, page: 1 })
}

/**
 * Picking a column sorts it descending — newest, highest, most recent first is
 * what people mean by "sorteer op datum". Picking the column it already sorts
 * on flips the direction, because there is no "off" to return to: the explorer
 * is always sorted by something (see `DEFAULT_SORT`), so the only question a
 * second click can answer is which end you want.
 */
function setSort(value: SortField) {
  const active = props.query.sort === value
  emit('update', {
    ...props.query,
    sort: value,
    order: active ? (props.query.order === 'desc' ? 'asc' : 'desc') : 'desc',
    page: 1,
  })
}

function setOrder(order: 'asc' | 'desc') {
  emit('update', { ...props.query, order, page: 1 })
}

/** The active column's own words for its two directions. */
const direction = computed(() => {
  const option = sortOption(props.query.sort)
  return [
    { value: 'desc' as const, label: option.desc },
    { value: 'asc' as const, label: option.asc },
  ]
})
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
      class="studio-fade absolute top-full left-0 z-30 mt-2 flex w-[420px] flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-overlay"
    >
      <section>
        <h3 class="studio-label mb-2">STATUS</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="status in STATUSES"
            :key="status.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="
              query.status.includes(status.value)
                ? 'border-blue-border bg-blue-tint text-blue-ink'
                : 'border-line bg-surface text-muted hover:border-line-hover'
            "
            @click="setStatus(status.value)"
          >
            {{ status.label }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="studio-label mb-2">TOEWIJZING</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="option in [
              { value: 'reviewer' as const, label: 'Ik beoordeel' },
              { value: 'creator' as const, label: 'Ik stelde op' },
            ]"
            :key="option.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="
              query.mine === option.value
                ? 'border-blue-border bg-blue-tint text-blue-ink'
                : 'border-line bg-surface text-muted hover:border-line-hover'
            "
            @click="setMine(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="studio-label mb-2">TYPE</h3>
        <!-- Fifteen types is more than fits; the list scrolls rather than
             growing the popover past the filter bar it hangs from. -->
        <div class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          <button
            v-for="type in TYPES"
            :key="type.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="
              query.type.includes(type.value)
                ? 'border-blue-border bg-blue-tint text-blue-ink'
                : 'border-line bg-surface text-muted hover:border-line-hover'
            "
            @click="setType(type.value)"
          >
            {{ type.label }}
          </button>
        </div>
        <!-- Said plainly rather than hidden: `GET /inquiry` has no type filter,
             so this one narrows the page you are looking at, not the query. -->
        <p class="text-sm mt-2 text-label">Type filtert de zichtbare pagina, niet de hele set.</p>
      </section>

      <!-- Sorting is a different verb from filtering, so it sits below a rule
           rather than as a fourth chip group. Unlike the sets above it, this
           one is single-choice: the API sorts on one column. -->
      <section class="border-t border-divider pt-3.5">
        <h3 class="studio-label mb-2">SORTEREN OP</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="option in SORT_OPTIONS"
            :key="option.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="
              query.sort === option.value
                ? 'border-blue-border bg-blue-tint text-blue-ink'
                : 'border-line bg-surface text-muted hover:border-line-hover'
            "
            :aria-pressed="query.sort === option.value"
            @click="setSort(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <!-- The direction's words come from the column it applies to:
             "oudste eerst" beats "oplopend" on a date. -->
        <div class="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            v-for="option in direction"
            :key="option.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="
              query.order === option.value
                ? 'border-blue-border bg-blue-tint text-blue-ink'
                : 'border-line bg-surface text-muted hover:border-line-hover'
            "
            :aria-pressed="query.order === option.value"
            @click="setOrder(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <p class="text-sm mt-2 text-label">
          Klik dezelfde kolom nog eens om de richting om te draaien.
          <template v-if="isDefaultSort(query)">Dit is de standaardvolgorde.</template>
        </p>
        <p v-if="query.sort === 'type' || query.sort === 'status'" class="text-sm mt-1 text-label">
          Type en status volgen de volgorde van de database-enum: dat groepeert de rijen,
          maar rangschikt ze niet.
        </p>
      </section>
    </div>
  </div>
</template>
