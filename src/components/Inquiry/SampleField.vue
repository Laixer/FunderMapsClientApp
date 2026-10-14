<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Field from '@/components/Common/Field.vue'
import ToggleChip from '@/components/Common/ToggleChip.vue'
import { dateOfYear, yearOfDate, type SampleFieldDef } from '@/services/sampleFields'
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
  /** A finding names this field too, but its words stand under another field: the amber frame only. */
  flagged?: boolean
  /** This field shares its grid row with a labelled control (only a yes/no chip cares). */
  besideControl?: boolean
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
    case 'year':
      // A text box, not a number input: that one takes "193e1" for 1930.
      return 'text' as const
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

const isYear = computed(() => props.field.kind === 'year')

/** A year field takes `min` up to `max`; without a `max`, up to this year (nothing is built in the future). */
const firstYear = computed(() => props.field.min ?? 1000)
const lastYear = computed(() => props.field.max ?? new Date().getFullYear())

const yearLabel = (date: unknown) => String(yearOfDate(date) ?? '')

/**
 * What is typed in a year box. Kept apart from the stored date, so that a
 * half-typed year is not sent and a re-render does not take it out of the box.
 */
const yearText = ref(yearLabel(props.modelValue))

/** The year in the box, or null as long as it holds anything else. */
const typedYear = computed(() => {
  if (!/^\d{4}$/.test(yearText.value)) return null
  const year = Number(yearText.value)
  return year >= firstYear.value && year <= lastYear.value ? year : null
})

// An edit made in the box arrives here with the box already saying that year.
// Anything else moved the value from outside (the form went on to another
// address), and the box has to follow.
watch(
  () => props.modelValue,
  (date) => {
    if (!isYear.value) return
    if (typedYear.value === null || typedYear.value !== yearOfDate(date)) yearText.value = yearLabel(date)
  },
)

/**
 * An emptied box means no year (null). Four digits in range become 1 January
 * of that year, which is how the date column holds a year. Anything else is
 * not a year yet: nothing is sent, the value stays what it was, and the line
 * under the box says so. Sending "0193-01-01" for a half-typed 1931 would make
 * the API refuse the whole address.
 */
function updateYear(raw: unknown) {
  yearText.value = raw === null || raw === undefined ? '' : String(raw).trim()
  if (yearText.value === '') emit('update:modelValue', null)
  else if (typedYear.value !== null) emit('update:modelValue', dateOfYear(typedYear.value))
}

const yearRemark = computed(() => {
  if (!isYear.value || yearText.value === '' || typedYear.value !== null) return null
  const kept = yearOfDate(props.modelValue)
  return `Vul een jaar in van ${firstYear.value} tot en met ${lastYear.value}. Tot dan blijft ${
    kept === null ? 'het veld leeg' : `de vorige waarde (${kept}) staan`
  }.`
})

const value = computed({
  get: () => (isYear.value ? yearText.value : props.modelValue),
  set: (v) => (isYear.value ? updateYear(v) : update(v)),
})

/**
 * A number outside the field's own range gets a line, and nothing more: it is
 * still sent (a tool that refuses what the report says gets worked around).
 * The range sat on the input as min/max, where the browser shows it to nobody:
 * -99999 m NAP went in without a word.
 */
const rangeRemark = computed(() => {
  if (props.field.kind !== 'number' || typeof props.modelValue !== 'number') return null
  const { min, max } = props.field
  const nl = (n: number) => n.toLocaleString('nl-NL')
  if (min !== undefined && props.modelValue < min) {
    return max !== undefined ? `Buiten het bereik van ${nl(min)} tot ${nl(max)}. Klopt de waarde?` : `Lager dan ${nl(min)}. Klopt de waarde?`
  }
  if (max !== undefined && props.modelValue > max) {
    return min !== undefined ? `Buiten het bereik van ${nl(min)} tot ${nl(max)}. Klopt de waarde?` : `Hoger dan ${nl(max)}. Klopt de waarde?`
  }
  return null
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
  <!-- Beside labelled controls the chip stands on their line: 21px down, which is
       their label line and gap, less 1px because the chip is 2px taller. Centred
       on the cell it sank below them once they grew a remark underneath. A row
       of chips only has no label line to leave room for. -->
  <div
    v-if="field.kind === 'bool'"
    class="flex h-full flex-col items-start gap-1.5"
    :class="besideControl ? 'pt-[21px]' : 'justify-center'"
  >
    <ToggleChip v-model="boolValue" :label="label" tristate />
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
      :min="isYear ? undefined : field.min"
      :max="isYear ? undefined : field.max"
      :step="field.step"
      :mono="isYear"
      :placeholder="isYear ? 'jjjj' : undefined"
      :hint="pending || confirmed ? undefined : field.hint"
      :error="yearRemark ?? warning ?? rangeRemark"
      :flagged="flagged"
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
