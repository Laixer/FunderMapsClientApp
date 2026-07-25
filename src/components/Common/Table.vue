<script setup lang="ts" generic="T">
type Column = {
  field: string
  title: string
  width?: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
}

const props = withDefaults(
  defineProps<{
    rows: T[]
    columns: Column[]
    loading?: boolean
    selectedId?: string | number | null
    emptyMessage?: string
    loadingMessage?: string
    rowKey?: (row: T) => string | number
    clickable?: boolean
    /** Active sort state, owned by the parent; `sort` emits the clicked field. */
    sortField?: string | null
    sortOrder?: 'asc' | 'desc'
    /** Placeholder rows drawn while loading. */
    skeletonRows?: number
  }>(),
  {
    loading: false,
    selectedId: null,
    emptyMessage: 'Geen resultaten.',
    loadingMessage: 'Laden…',
    skeletonRows: 5,
    clickable: true,
    sortField: null,
    sortOrder: 'desc',
  },
)

const emit = defineEmits<{ select: [row: T]; sort: [field: string] }>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fieldValue = (row: T, field: string): any => (row as Record<string, unknown>)[field]

const keyFor = (row: T, idx: number): string | number => {
  if (props.rowKey) return props.rowKey(row)
  const id = fieldValue(row, 'id')
  return typeof id === 'string' || typeof id === 'number' ? id : idx
}

const alignClass = (align?: 'left' | 'right' | 'center') =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'

/**
 * Placeholder bar widths, so the loading state looks like a table of text rather
 * than a row of identical grey blocks. Derived from the column index and kept
 * deterministic — a random width that changes every tick would shimmer.
 */
const SKELETON_WIDTHS = ['w-8', 'w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-5/6']
const skeletonWidth = (col: number): string => SKELETON_WIDTHS[col % SKELETON_WIDTHS.length]!

const isSelected = (row: T): boolean => {
  if (props.selectedId == null) return false
  return fieldValue(row, 'id') === props.selectedId
}
</script>

<template>
  <div class="border-grey-200 overflow-x-auto rounded-md border bg-white">
    <table class="w-full text-sm">
      <thead
        class="border-grey-200 bg-grey-100 text-grey-700 border-b text-xs font-semibold tracking-wide uppercase"
      >
        <tr>
          <th
            v-for="c in columns"
            :key="c.field"
            class="px-3 py-2"
            :class="[
              alignClass(c.align),
              c.sortable && 'hover:text-grey-800 cursor-pointer select-none',
            ]"
            :style="c.width ? { width: c.width } : undefined"
            :aria-sort="
              c.sortable && sortField === c.field
                ? sortOrder === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined
            "
            @click="c.sortable && emit('sort', c.field)"
          >
            <span class="inline-flex items-center gap-1">
              {{ c.title }}
              <span v-if="c.sortable && sortField === c.field" aria-hidden="true">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Skeleton rows rather than a "Laden…" cell: the table keeps its shape,
             so nothing jumps when the data lands. `animate-pulse` is already
             neutralised by the global prefers-reduced-motion rule. -->
        <template v-if="loading">
          <tr
            v-for="n in skeletonRows"
            :key="`skeleton-${n}`"
            class="border-grey-200 border-t"
            aria-hidden="true"
          >
            <td v-for="(c, i) in columns" :key="c.field" class="px-3 py-2">
              <span class="bg-grey-200 block h-3 animate-pulse rounded" :class="skeletonWidth(i)" />
            </td>
          </tr>
          <tr class="sr-only">
            <td :colspan="columns.length">{{ loadingMessage }}</td>
          </tr>
        </template>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length" class="text-grey-700 px-3 py-4 text-center">
            {{ emptyMessage }}
          </td>
        </tr>
        <tr
          v-for="(row, idx) in rows"
          v-else
          :key="keyFor(row, idx)"
          class="border-grey-200 border-t transition-colors"
          :class="[
            clickable && 'hover:bg-grey-100 cursor-pointer',
            isSelected(row) && 'bg-grey-100',
          ]"
          @click="clickable && emit('select', row)"
        >
          <td
            v-for="c in columns"
            :key="c.field"
            class="text-grey-800 px-3 py-2 align-middle"
            :class="alignClass(c.align)"
          >
            <slot :name="c.field" :row="row" :value="fieldValue(row, c.field)">
              {{ fieldValue(row, c.field) ?? '—' }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
