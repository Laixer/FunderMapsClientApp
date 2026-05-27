<script setup lang="ts" generic="T">
type Column = {
  field: string
  title: string
  width?: string
  align?: 'left' | 'right' | 'center'
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
  }>(),
  {
    loading: false,
    selectedId: null,
    emptyMessage: 'Geen resultaten.',
    loadingMessage: 'Laden…',
    clickable: true,
  },
)

const emit = defineEmits<{ select: [row: T] }>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fieldValue = (row: T, field: string): any => (row as Record<string, unknown>)[field]

const keyFor = (row: T, idx: number): string | number => {
  if (props.rowKey) return props.rowKey(row)
  const id = fieldValue(row, 'id')
  return typeof id === 'string' || typeof id === 'number' ? id : idx
}

const alignClass = (align?: 'left' | 'right' | 'center') =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'

const isSelected = (row: T): boolean => {
  if (props.selectedId == null) return false
  return fieldValue(row, 'id') === props.selectedId
}
</script>

<template>
  <div class="overflow-x-auto rounded-md border border-grey-200 bg-white">
    <table class="w-full text-sm">
      <thead
        class="border-b border-grey-200 bg-grey-100 text-xs font-semibold uppercase tracking-wide text-grey-700"
      >
        <tr>
          <th
            v-for="c in columns"
            :key="c.field"
            class="px-3 py-2"
            :class="alignClass(c.align)"
            :style="c.width ? { width: c.width } : undefined"
          >
            {{ c.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-3 py-4 text-center text-grey-700">
            {{ loadingMessage }}
          </td>
        </tr>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length" class="px-3 py-4 text-center text-grey-700">
            {{ emptyMessage }}
          </td>
        </tr>
        <tr
          v-for="(row, idx) in rows"
          v-else
          :key="keyFor(row, idx)"
          class="border-t border-grey-200 transition-colors"
          :class="[
            clickable && 'cursor-pointer hover:bg-grey-100',
            isSelected(row) && 'bg-grey-100',
          ]"
          @click="clickable && emit('select', row)"
        >
          <td
            v-for="c in columns"
            :key="c.field"
            class="px-3 py-2 align-middle text-grey-800"
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
