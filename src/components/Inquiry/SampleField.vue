<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Field from '@/components/Common/Field.vue'
import ToggleChip from '@/components/Common/ToggleChip.vue'
import type { SampleFieldDef } from '@/services/sampleFields'
import { isConfirmed, type FieldProvenance } from '@/services/sampleProvenance'

/**
 * Renders one sample field from its registry descriptor. Every input in the
 * sample form goes through here, so a per-field affordance — provenance marks
 * today, extraction confidence when the Data Ops pipeline starts proposing
 * values — is added once rather than sixty times.
 */
const props = defineProps<{
  field: SampleFieldDef
  modelValue: unknown
  /** Absent means the value was typed here — the overwhelmingly common case. */
  provenance?: FieldProvenance
  /** A cross-field finding that mentions this field, in words. */
  warning?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  confirm: []
}>()

const { t } = useI18n()

/**
 * Vue's `.number` v-model modifier, replicated.
 *
 * The hand-written form used `v-model.number` on every numeric input. That runs
 * `parseFloat` and keeps the original value when the result is NaN — so
 * clearing a field yields `''`, not `null`, which the API rejects. Fixed here
 * rather than reproduced: an emptied field means *no value*, and `null` is how
 * this API spells that.
 */
function toNumberOrNull(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  const n = Number.parseFloat(value as string)
  return Number.isNaN(n) ? null : n
}

function update(value: unknown) {
  emit('update:modelValue', props.field.kind === 'number' ? toNumberOrNull(value) : value)
}

/** Inside the form the surrounding section supplies context, so prefer the short label. */
const label = computed(() => props.field.shortLabel ?? props.field.label)

const kind = computed(() => {
  switch (props.field.kind) {
    case 'number':
      return 'number' as const
    case 'date':
      return 'date' as const
    case 'enum':
      return 'select' as const
    default:
      return 'text' as const
  }
})

/** ToggleChip types its model as `boolean | null`, so narrow rather than cast. */
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
</script>

<template>
  <!-- Booleans render as chips, not as a labelled control: a checkbox in a
       two-column grid of 32px fields has to invent a label row to line up with
       its neighbours, and ends up looking like a field that failed to load. -->
  <!-- `items-start` so the chip hugs its own label instead of stretching to the
       width of the grid column it happens to land in. -->
  <div v-if="field.kind === 'bool'" class="flex h-full flex-col items-start justify-center gap-1.5">
    <ToggleChip v-model="boolValue" :label="label" />
    <p v-if="pending" class="text-sm flex flex-wrap items-center gap-x-1.5 text-muted">
      <span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
      <span>
        {{
          inheritedFromAddress
            ? t('sample.provenance.inherited', { address: inheritedFromAddress })
            : t('sample.provenance.unverified')
        }}
      </span>
      <button
        type="button"
        class="font-semibold text-green-ink underline underline-offset-2"
        @click="emit('confirm')"
      >
        {{ t('sample.provenance.confirm') }}
      </button>
    </p>
  </div>

  <div v-else class="flex flex-col gap-1.5">
    <Field
      v-model="value"
      :label="label"
      :kind="kind"
      :unit="field.unit"
      :options="field.options"
      :min="field.min"
      :max="field.max"
      :step="field.step"
      :hint="pending || confirmed ? undefined : field.hint"
      :error="warning"
      empty-label="—"
    />

    <p v-if="pending" class="text-sm flex flex-wrap items-center gap-x-1.5 text-muted">
      <span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
      <span>
        {{
          inheritedFromAddress
            ? t('sample.provenance.inherited', { address: inheritedFromAddress })
            : t('sample.provenance.unverified')
        }}
      </span>
      <button
        type="button"
        class="font-semibold text-green-ink underline underline-offset-2"
        @click="emit('confirm')"
      >
        {{ t('sample.provenance.confirm') }}
      </button>
    </p>

    <p v-else-if="confirmed" class="text-sm text-label">
      {{ t('sample.provenance.confirmed') }}
    </p>
  </div>
</template>
