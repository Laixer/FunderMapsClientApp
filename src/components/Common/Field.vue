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
  }>(),
  { kind: 'text', required: false, disabled: false, mono: false, rows: 4 },
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

const frameClass = computed(() => {
  if (props.disabled) return 'border-line bg-canvas'
  if (props.error) return 'border-amber-field bg-surface'
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
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error || hint ? `${id}-help` : undefined"
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
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error || hint ? `${id}-help` : undefined"
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
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error || hint ? `${id}-help` : undefined"
      />

      <span v-if="suffix" class="text-xs shrink-0 text-label" aria-hidden="true">{{ suffix }}</span>
    </div>

    <p v-if="error" :id="`${id}-help`" class="text-sm text-amber-ink">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-help`" class="text-sm text-label">{{ hint }}</p>
  </div>
</template>
