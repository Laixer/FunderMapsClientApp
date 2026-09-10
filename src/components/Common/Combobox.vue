<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'

import type { SelectOption } from '@/services/options'

/**
 * A select you can type into.
 *
 * Same anatomy as `Field`: label, 32px control in a hairline frame, hint. The
 * difference is what happens inside the frame: typing filters the list, ↑/↓
 * walk it, Enter picks, Esc closes. Built for lists too long to scroll with
 * confidence -- the uitvoerders, several hundred bureaus where the one you
 * want is "Fugro" and the select shows you "Fundament Adviesbureau" first
 * (ClientApp #333, point 6).
 *
 * The value is the option's `value`, never the typed text: a name that matches
 * nothing selects nothing, and the frame says so instead of storing prose in
 * a foreign key.
 */
const props = withDefaults(
  defineProps<{
    label?: string
    options: SelectOption[]
    placeholder?: string
    hint?: string
    error?: string | null
    required?: boolean
    disabled?: boolean
    /** Label of the choice that clears the value. Omit for a required pick. */
    emptyLabel?: string
    /** Rows visible before the list scrolls. */
    visible?: number
  }>(),
  { required: false, disabled: false, visible: 8 },
)

const model = defineModel<string | number | null>()

const id = useId()
const listId = `${id}-list`
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const open = ref(false)
const cursor = ref(0)

const selected = computed(() => props.options.find((o) => o.value === model.value) ?? null)

/**
 * Word-prefix match on every word of every label, case- and accent-blind:
 * "fug" finds "Fugro NL B.V.", "bouw" finds "BVL bouwadvies". A substring
 * match would also surface "Rabobank" for "bank", which is not what a person
 * typing the start of a name means.
 */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
const filtered = computed(() => {
  const q = fold(query.value.trim())
  if (!q) return props.options
  const words = q.split(/\s+/)
  return props.options.filter((o) => {
    const label = fold(o.label)
    const parts = label.split(/[\s\-/(),.]+/)
    return words.every((w) => label.startsWith(w) || parts.some((p) => p.startsWith(w)))
  })
})

/** What the control shows while closed: the pick, or nothing. */
const shownText = computed(() => (open.value ? query.value : (selected.value?.label ?? '')))

function show() {
  if (props.disabled) return
  open.value = true
  query.value = ''
  cursor.value = Math.max(
    0,
    filtered.value.findIndex((o) => o.value === model.value),
  )
  void nextTick(scrollCursorIntoView)
}

function hide() {
  open.value = false
  query.value = ''
}

function pick(option: SelectOption | undefined) {
  if (!option) return
  model.value = option.value as string | number
  hide()
}

function clear() {
  model.value = null
  hide()
  input.value?.focus()
}

function move(delta: number) {
  if (!open.value) {
    show()
    return
  }
  if (!filtered.value.length) return
  cursor.value = Math.max(0, Math.min(filtered.value.length - 1, cursor.value + delta))
  scrollCursorIntoView()
}

function scrollCursorIntoView() {
  const el = document.getElementById(`${listId}-${cursor.value}`)
  el?.scrollIntoView({ block: 'nearest' })
}

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  if (!open.value) open.value = true
  cursor.value = 0
}

function onEnter() {
  if (!open.value) {
    show()
    return
  }
  pick(filtered.value[cursor.value])
}

/** Blur closes, but after a click on the list has had its chance to land. */
function onBlur() {
  window.setTimeout(() => {
    if (document.activeElement !== input.value) hide()
  }, 120)
}

watch(filtered, (list) => {
  if (cursor.value > list.length - 1) cursor.value = 0
})

const frameClass = computed(() => {
  if (props.disabled) return 'border-line bg-canvas'
  if (props.error) return 'border-amber-field bg-surface'
  return 'border-line-strong bg-surface'
})
</script>

<template>
  <div class="relative flex min-w-0 flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm flex items-center gap-1 font-semibold text-subtle">
      {{ label }}
      <span v-if="required" class="text-red" aria-hidden="true">*</span>
      <span v-if="required" class="sr-only">(verplicht)</span>
    </label>

    <div
      class="flex h-8 items-center gap-2 rounded-lg border px-2.5 focus-within:border-green focus-within:ring-2 focus-within:ring-green/30"
      :class="frameClass"
    >
      <input
        :id="id"
        ref="input"
        class="studio-control"
        type="text"
        role="combobox"
        autocomplete="off"
        :value="shownText"
        :placeholder="selected ? selected.label : (placeholder ?? 'Typ om te zoeken')"
        :disabled="disabled"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="open ? `${listId}-${cursor}` : undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error || hint ? `${id}-help` : undefined"
        aria-autocomplete="list"
        @focus="show"
        @click="show"
        @blur="onBlur"
        @input="onInput"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="onEnter"
        @keydown.esc.prevent="hide"
        @keydown.tab="hide"
      />
      <button
        v-if="selected && emptyLabel && !disabled"
        type="button"
        class="text-xs shrink-0 text-label hover:text-strong"
        :title="emptyLabel"
        :aria-label="emptyLabel"
        tabindex="-1"
        @mousedown.prevent
        @click="clear"
      >
        ×
      </button>
      <span v-else class="text-xs shrink-0 text-label" aria-hidden="true">▾</span>
    </div>

    <ul
      v-if="open"
      :id="listId"
      role="listbox"
      class="absolute top-full right-0 left-0 z-20 mt-1 overflow-y-auto rounded-lg border border-line bg-surface shadow-sm"
      :style="{ maxHeight: `${visible * 32}px` }"
    >
      <li
        v-if="!filtered.length"
        class="text-md px-2.5 py-1.5 text-muted"
      >
        Niets gevonden voor “{{ query }}”.
      </li>
      <li
        v-for="(option, i) in filtered"
        :id="`${listId}-${i}`"
        :key="String(option.value)"
        role="option"
        :aria-selected="option.value === model"
        class="text-md cursor-pointer truncate border-b border-divider px-2.5 py-1.5 text-body last:border-b-0"
        :class="[
          i === cursor ? 'bg-blue-wash' : 'hover:bg-raised',
          option.value === model ? 'font-semibold' : '',
        ]"
        @mousedown.prevent
        @click="pick(option)"
        @mousemove="cursor = i"
      >
        {{ option.label }}
      </li>
    </ul>

    <p v-if="error" :id="`${id}-help`" class="text-sm text-amber-ink">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-help`" class="text-sm text-label">{{ hint }}</p>
  </div>
</template>
