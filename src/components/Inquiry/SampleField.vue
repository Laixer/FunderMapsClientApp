<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Input from '@/components/Common/Inputs/Input.vue'
import Select from '@/components/Common/Inputs/Select.vue'
import CheckBox from '@/components/Common/Inputs/CheckBox.vue'
import type { SampleFieldDef } from '@/services/sampleFields'
import { isConfirmed, type FieldProvenance } from '@/services/sampleProvenance'

/**
 * Renders one sample field from its registry descriptor. Every input in the
 * sample form goes through here, so a per-field affordance (provenance marks,
 * validation findings, extraction confidence) is added once rather than sixty
 * times.
 */
const props = defineProps<{
  field: SampleFieldDef
  modelValue: unknown
  /** Absent means the value was typed here — the overwhelmingly common case. */
  provenance?: FieldProvenance
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  confirm: []
}>()

const { t } = useI18n()

/**
 * Vue's `.number` v-model modifier, replicated.
 *
 * The hand-written form used `v-model.number` on every numeric input. That
 * runs `parseFloat` and keeps the original value when the result is NaN — so
 * clearing a field yields `''`, not `null`. Reproduced deliberately, quirk and
 * all: the registry refactor must not change what reaches the API. (The `''` is
 * a real problem — the API validates these as `z.number().nullish()` and
 * rejects it — but fixing it here would hide a behaviour change inside a
 * refactor.)
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

const pending = computed(() => props.provenance !== undefined && !isConfirmed(props.provenance))
const confirmed = computed(() => isConfirmed(props.provenance))

const inheritedFromAddress = computed(() =>
  props.provenance?.source.kind === 'inherited' ? props.provenance.source.fromAddress : null,
)

/**
 * A checkbox root is an inline-flex `<label>`; as a direct grid child it used
 * to stretch to the row height and centre its own content. Wrapping it costs
 * that stretch, so restore it here — the other kinds have block roots and are
 * unaffected.
 */
const wrapperClass = computed(() =>
  props.field.kind === 'bool' ? 'flex h-full flex-col justify-center gap-1' : 'flex flex-col gap-1',
)
</script>

<template>
  <div :class="wrapperClass">
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

    <p v-if="pending" class="text-grey-700 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
      <span>{{
        inheritedFromAddress
          ? t('sample.provenance.inherited', { address: inheritedFromAddress })
          : t('sample.provenance.unverified')
      }}</span>
      <button
        type="button"
        class="font-medium text-green-700 underline underline-offset-2"
        @click="emit('confirm')"
      >
        {{ t('sample.provenance.confirm') }}
      </button>
    </p>

    <p v-else-if="confirmed" class="text-grey-400 text-xs">
      {{ t('sample.provenance.confirmed') }}
    </p>
  </div>
</template>
