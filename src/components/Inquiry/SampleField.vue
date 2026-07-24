<script setup lang="ts">
import { computed } from 'vue'

import Input from '@/components/Common/Inputs/Input.vue'
import Select from '@/components/Common/Inputs/Select.vue'
import CheckBox from '@/components/Common/Inputs/CheckBox.vue'
import type { SampleFieldDef } from '@/services/sampleFields'

/**
 * Renders one sample field from its registry descriptor. Every input in the
 * sample form goes through here, so a per-field affordance (provenance marks,
 * validation findings, extraction confidence) is added once rather than sixty
 * times.
 */
const props = defineProps<{
  field: SampleFieldDef
  modelValue: unknown
}>()

const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

/**
 * Vue's `.number` v-model modifier, replicated.
 *
 * The hand-written form used `v-model.number` on every numeric input. That
 * runs `parseFloat` and keeps the original value when the result is NaN — so
 * clearing a field yields `''`, not `null`. Reproduced deliberately, quirk and
 * all: this refactor must not change what reaches the API. (The `''` is a real
 * problem — the API validates these as `z.number().nullish()` and rejects it —
 * but fixing it here would hide a behaviour change inside a refactor.)
 */
function looseToNumber(value: unknown): unknown {
  const n = Number.parseFloat(value as string)
  return Number.isNaN(n) ? value : n
}

function update(value: unknown) {
  emit('update:modelValue', props.field.kind === 'number' ? looseToNumber(value) : value)
}

/** Inside the form the surrounding row supplies context, so prefer the short label. */
const label = computed(() => props.field.shortLabel ?? props.field.label)

const inputType = computed(() => {
  switch (props.field.kind) {
    case 'number':
      return 'number'
    case 'date':
      return 'date'
    default:
      return 'text'
  }
})

/** CheckBox types its model as `boolean | null`, so narrow rather than cast at the binding. */
const boolValue = computed<boolean | null>({
  get: () => (props.modelValue ?? null) as boolean | null,
  set: (v) => update(v),
})

const value = computed({
  get: () => props.modelValue,
  set: (v) => update(v),
})
</script>

<template>
  <CheckBox v-if="field.kind === 'bool'" v-model="boolValue" :label="label" />

  <Select
    v-else-if="field.kind === 'enum'"
    v-model="value"
    :label="label"
    :options="field.options"
    placeholder="-"
    clearable
  />

  <Input
    v-else
    v-model="value"
    :label="label"
    :type="inputType"
    :min="field.min"
    :max="field.max"
    :step="field.step"
  />
</template>
