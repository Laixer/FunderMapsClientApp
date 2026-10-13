<script setup lang="ts">
/**
 * Where a reviewer puts a value: a list for a coded field (yes/no is one), a
 * number box for a measurement, a text box for the rest.
 *
 * One control for "Waarde toevoegen" and for "Andere waarde" in the Aanpassen
 * drawer, so both send what the commit can read: the code and never the Dutch
 * word, a number the way the API parses it.
 *
 * The value is always text, because that is what the API takes ("true",
 * "1.25", "wood_charger"). `Field` hands back a number from a number box; the
 * callers trim what they send, and a number has no trim: in "Waarde toevoegen"
 * that took the whole panel off the screen when a number field was picked
 * after a list field.
 */
import { computed } from 'vue'

import Field from '@/components/Common/Field.vue'
import { valueHint, valueKind, valueOptions } from '@/services/reviewLabels'

const props = defineProps<{
  /** The lane's field key (`foundation_type`); null while none is picked. */
  field: string | null
  label: string
}>()

const model = defineModel<string>()

const kind = computed(() => valueKind(props.field))

/** Nothing picked is the list's empty choice, which is null to a select. */
const inner = computed<unknown>({
  get: () => model.value || (kind.value === 'select' ? null : ''),
  set: (value) => {
    model.value = value == null ? '' : String(value)
  },
})
</script>

<template>
  <Field
    v-if="kind === 'select'"
    v-model="inner"
    kind="select"
    :label="label"
    :options="valueOptions(field)"
    empty-label="Kies een waarde"
  />
  <!-- Keyed by kind: an input decides when it is made whether it hands back a
       number, so a box made for a number would turn "12 palen" into 12. -->
  <Field
    v-else
    :key="kind"
    v-model="inner"
    :kind="kind"
    :label="label"
    :hint="valueHint(field)"
    :step="kind === 'number' ? 'any' : undefined"
  />
</template>
