<script setup lang="ts">
import { computed, useId } from 'vue'

import type { SelectOption } from '@/services/options'

export type FieldKind = 'text' | 'number' | 'date' | 'select' | 'textarea'

/**
 * One labelled control — the atom every form in the studio is built from.
 *
 * Anatomy, top to bottom: a small uppercase-ish label with a red asterisk when
 * required, a 32px control framed by a hairline, and a hint line. The unit
 * ("m NAP", "mm") lives *inside* the control on the right, so a column of
 * measurements stays aligned on its digits instead of on a suffix of varying
 * length.
 *
 * Numbers, dates and identifiers render in the mono face. That is not a
 * flourish: in a form of sixty fields, half of them depths in metres, mono is
 * what lets you see at a glance that one of them is an order of magnitude off.
 *
 * Errors are amber, not red, and always carry a sentence. Red is reserved for
 * things that have gone wrong; a field you have not finished filling in has not
 * gone wrong.
 */
const props = withDefaults(
  defineProps<{
    label?: string
    /** Names the control for a screen reader when there is no visible label (a panel caption does that job on screen). */
    ariaLabel?: string
    kind?: FieldKind
    options?: SelectOption[]
    placeholder?: string
    /** Suffix shown inside the control, e.g. `m NAP`. */
    unit?: string
    /** Grey line under the control explaining where the value comes from. */
    hint?: string
    /** A sentence naming what is wrong. Turns the frame amber. */
    error?: string | null
    required?: boolean
    disabled?: boolean
    /** Force the mono face. Numbers and dates already opt in. */
    mono?: boolean
    rows?: number
    min?: number | string
    max?: number | string
    step?: number | string
    /** Placeholder option for a select; `null` clears the value. */
    emptyLabel?: string
    /**
     * For a date that cannot lie ahead, such as a document's own date: a date
     * after today gets an amber line asking about the year. It never blocks;
     * the QuickScan feed has real reports dated a few days ahead.
     */
    warnFuture?: boolean
  }>(),
  { kind: 'text', required: false, disabled: false, mono: false, rows: 4, warnFuture: false },
)

const model = defineModel<unknown>()

const id = useId()

const isMono = computed(() => props.mono || props.kind === 'number' || props.kind === 'date')

const inputType = computed(() => (props.kind === 'number' ? 'number' : props.kind))

/**
 * Selects and dates draw their own affordance on the right; a unit would land
 * on top of it. The chevron doubles as the select's unit slot.
 */
const suffix = computed(() => {
  if (props.kind === 'select') return '▾'
  return props.unit ?? null
})

/** Today as the date input spells it, in the user's own timezone. */
function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * "15-05-2926" was saved as a rapportage's date on 2026-09-23 and nobody was
 * told. A sentence under the field is enough to catch the slip while the
 * document is still open next to it.
 */
const futureWarning = computed(() => {
  if (!props.warnFuture || props.kind !== 'date' || typeof model.value !== 'string') return null
  const day = model.value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  return day > todayIso() ? 'Deze datum ligt in de toekomst. Klopt het jaar?' : null
})

/** What goes in the amber line: the caller's error first, then our own doubt. */
const warning = computed(() => props.error || futureWarning.value)

const frameClass = computed(() => {
  if (props.disabled) return 'border-line bg-canvas'
  if (warning.value) return 'border-amber-field bg-surface'
  return 'border-line-strong bg-surface'
})
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm flex items-center gap-1 font-semibold text-subtle">
      {{ label }}
      <span v-if="required" class="text-red" aria-hidden="true">*</span>
      <span v-if="required" class="sr-only">(verplicht)</span>
    </label>

    <!-- textarea breaks the 32px rule by design: a note is prose, and a
         one-line box invites one-line notes. -->
    <div
      v-if="kind === 'textarea'"
      class="rounded-lg border px-2.5 py-2 focus-within:border-green focus-within:ring-2 focus-within:ring-green/30"
      :class="frameClass"
    >
      <textarea
        :id="id"
        v-model="model as string"
        class="studio-control"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="label ? undefined : ariaLabel"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="warning || hint ? `${id}-help` : undefined"
      />
    </div>

    <div
      v-else
      class="flex h-8 items-center gap-2 rounded-lg border px-2.5 focus-within:border-green focus-within:ring-2 focus-within:ring-green/30"
      :class="frameClass"
    >
      <select
        v-if="kind === 'select'"
        :id="id"
        v-model="model"
        class="studio-control"
        :disabled="disabled"
        :aria-label="label ? undefined : ariaLabel"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="warning || hint ? `${id}-help` : undefined"
      >
        <option v-if="emptyLabel || placeholder" :value="null">
          {{ emptyLabel ?? placeholder }}
        </option>
        <option v-for="option in options" :key="String(option.value)" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <input
        v-else
        :id="id"
        v-model="model"
        class="studio-control"
        :class="isMono && 'font-mono'"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        :aria-label="label ? undefined : ariaLabel"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="warning || hint ? `${id}-help` : undefined"
      />

      <span v-if="suffix" class="text-xs shrink-0 text-label" aria-hidden="true">{{ suffix }}</span>
    </div>

    <p v-if="warning" :id="`${id}-help`" class="text-sm text-amber-ink">{{ warning }}</p>
    <p v-else-if="hint" :id="`${id}-help`" class="text-sm text-label">{{ hint }}</p>
  </div>
</template>
