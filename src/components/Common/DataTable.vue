<script setup lang="ts" generic="T extends { id: string | number }">
import { computed } from 'vue'

export interface DataColumn {
  field: string
  title: string
  /** A CSS grid track: `84px`, `minmax(260px,1fr)`, `1fr`. */
  width: string
  align?: 'left' | 'right'
  sortable?: boolean
}

/**
 * The studio's table.
 *
 * A CSS grid rather than a `<table>`, because the layout the design asks for —
 * a name column that flexes on `minmax(260px, 1fr)` while every other column
 * holds a fixed track, with a sticky header and full-row hit targets — is
 * something grid states directly and table layout only approximates. The ARIA
 * roles put the semantics back.
 *
 * Rows are 34–38px and the whole row is the click target. Two selections
 * coexist and mean different things: `activeId` is *what the inspector is
 * showing* (one row, pale blue), `selectedIds` is *what a bulk action would
 * apply to* (many rows, blue checkbox). Conflating them makes it impossible to
 * look at one dossier while three others are staged.
 *
 * Not virtualised, and deliberately so: the list endpoint pages server-side, so
 * the DOM never holds more than one page. Windowing would buy nothing and cost
 * the sticky header, keyboard scrolling and text selection.
 */
const props = withDefaults(
  defineProps<{
    rows: T[]
    columns: DataColumn[]
    loading?: boolean
    /** Row the inspector is showing / the keyboard cursor is on. */
    activeId?: string | number | null
    /** Rows staged for a bulk action. Renders the checkbox column. */
    selectedIds?: ReadonlySet<string | number>
    selectable?: boolean
    sortField?: string | null
    sortOrder?: 'asc' | 'desc'
    emptyMessage?: string
    skeletonRows?: number
  }>(),
  {
    loading: false,
    activeId: null,
    selectable: false,
    sortField: null,
    sortOrder: 'desc',
    emptyMessage: 'Geen resultaten.',
    skeletonRows: 8,
  },
)

const emit = defineEmits<{
  select: [row: T]
  sort: [field: string]
  toggle: [row: T]
  toggleAll: []
}>()

/** The checkbox column is a fixed 34px gutter ahead of the data tracks. */
const template = computed(() =>
  [props.selectable ? '34px' : '', ...props.columns.map((c) => c.width)].filter(Boolean).join(' '),
)

const allSelected = computed(
  () => props.rows.length > 0 && props.rows.every((r) => props.selectedIds?.has(r.id)),
)

/**
 * Placeholder widths derived from the column index rather than at random: a
 * width that changes every tick shimmers, and a row of identical grey blocks
 * does not look like a table of text.
 */
const SKELETON_WIDTHS = ['w-10', 'w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-5/6', 'w-2/5']

function rowClass(row: T): string {
  if (props.activeId === row.id) return 'bg-blue-wash'
  if (props.selectedIds?.has(row.id)) return 'bg-blue-wash/60'
  return 'bg-surface hover:bg-raised'
}
</script>

<template>
  <div role="table" class="min-w-0">
    <div
      role="row"
      class="text-xs sticky top-0 z-2 grid items-center gap-0 border-b border-line bg-raised px-5 py-2 font-bold tracking-[0.07em] text-label uppercase"
      :style="{ gridTemplateColumns: template }"
    >
      <button
        v-if="selectable"
        type="button"
        class="flex h-3 w-3 items-center justify-center rounded-xs border"
        :class="allSelected ? 'border-blue bg-blue' : 'border-line-hover bg-surface'"
        :aria-label="allSelected ? 'Selectie wissen' : 'Alles selecteren'"
        :aria-pressed="allSelected"
        @click="emit('toggleAll')"
      >
        <span v-if="allSelected" class="text-2xs leading-none text-white" aria-hidden="true">✓</span>
      </button>

      <component
        :is="column.sortable ? 'button' : 'span'"
        v-for="column in columns"
        :key="column.field"
        role="columnheader"
        :type="column.sortable ? 'button' : undefined"
        class="flex items-center gap-1 truncate"
        :class="[
          column.align === 'right' ? 'justify-end' : 'justify-start',
          column.sortable && 'hover:text-subtle',
        ]"
        :aria-sort="
          sortField === column.field
            ? sortOrder === 'asc'
              ? 'ascending'
              : 'descending'
            : undefined
        "
        @click="column.sortable && emit('sort', column.field)"
      >
        {{ column.title }}
        <span v-if="column.sortable && sortField === column.field" aria-hidden="true">
          {{ sortOrder === 'asc' ? '▲' : '▼' }}
        </span>
      </component>
    </div>

    <!-- Skeleton rows keep the table's shape while it loads, so nothing jumps
         when the data lands. `animate-pulse` is already neutralised by the
         global prefers-reduced-motion rule. -->
    <template v-if="loading">
      <div
        v-for="n in skeletonRows"
        :key="`skeleton-${n}`"
        class="grid items-center gap-0 border-b border-divider px-5 py-2.5"
        :style="{ gridTemplateColumns: template }"
        aria-hidden="true"
      >
        <span v-if="selectable" />
        <span v-for="(column, i) in columns" :key="column.field" class="pr-3">
          <span
            class="block h-3 animate-pulse rounded-xs bg-divider"
            :class="SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]"
          />
        </span>
      </div>
      <p class="sr-only" role="status">Laden…</p>
    </template>

    <p v-else-if="!rows.length" class="text-md border-b border-divider px-5 py-6 text-muted">
      {{ emptyMessage }}
    </p>

    <div
      v-for="row in rows"
      v-else
      :key="row.id"
      role="row"
      tabindex="0"
      class="grid cursor-pointer items-center gap-0 border-b border-divider px-5 py-2.5"
      :class="rowClass(row)"
      :style="{ gridTemplateColumns: template }"
      :aria-selected="activeId === row.id"
      @click="emit('select', row)"
      @keydown.enter.prevent="emit('select', row)"
      @keydown.space.prevent="emit('select', row)"
    >
      <!-- Stops at the checkbox: staging a row for a bulk action should not
           also swing the inspector over to it. -->
      <button
        v-if="selectable"
        type="button"
        class="flex h-3 w-3 items-center justify-center rounded-xs border"
        :class="selectedIds?.has(row.id) ? 'border-blue bg-blue' : 'border-line-hover bg-surface'"
        :aria-label="`Rij ${row.id} selecteren`"
        :aria-pressed="selectedIds?.has(row.id) ?? false"
        @click.stop="emit('toggle', row)"
      >
        <span v-if="selectedIds?.has(row.id)" class="text-2xs leading-none text-white" aria-hidden="true">
          ✓
        </span>
      </button>

      <div
        v-for="column in columns"
        :key="column.field"
        role="cell"
        class="min-w-0 truncate pr-3 last:pr-0"
        :class="column.align === 'right' && 'text-right'"
      >
        <slot :name="column.field" :row="row" />
      </div>
    </div>

    <div v-if="$slots.footer" class="flex items-center gap-3 px-5 py-3">
      <slot name="footer" />
    </div>
  </div>
</template>
