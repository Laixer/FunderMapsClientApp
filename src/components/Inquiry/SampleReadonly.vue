<script setup lang="ts">
import { computed } from 'vue'

import KeyValueList, { type KeyValueItem } from '@/components/Common/KeyValueList.vue'
import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import {
  SAMPLE_SECTIONS,
  fullLabel,
  isSampleFieldFilled,
  type SampleFieldDef,
} from '@/services/sampleFields'
import { formatDate } from '@/utils/date'

/**
 * One address, read-only, with the empty fields left out.
 *
 * A reviewer wants to see what was observed, not to count the fifty things that
 * were not. Sections with nothing in them disappear entirely, which turns a
 * sixty-row table into the handful of lines that carry the finding.
 */
const props = defineProps<{ sample: IInquirySample }>()

function display(field: SampleFieldDef): string {
  const value = props.sample[field.key]
  switch (field.kind) {
    case 'bool':
      return value ? 'Ja' : 'Nee'
    case 'enum':
      return field.options?.find((o) => o.value === value)?.label ?? String(value)
    case 'date':
      return formatDate(value as string)
    default:
      return String(value)
  }
}

/** Sections reduced to their filled fields; empty sections drop out. */
const filledSections = computed(() =>
  SAMPLE_SECTIONS.map((section) => ({
    title: section.title,
    items: section.fields
      .filter((field) => isSampleFieldFilled(props.sample[field.key]))
      .map<KeyValueItem>((field) => ({
        label: fullLabel(field),
        value: display(field),
        mono: field.kind === 'number' || field.kind === 'date',
      })),
  })).filter((section) => section.items.length > 0),
)

const isEmpty = computed(() => filledSections.value.length === 0 && !props.sample.note)
</script>

<template>
  <p v-if="isEmpty" class="text-md text-muted">Geen velden ingevuld.</p>

  <div v-else class="flex flex-col gap-4">
    <section v-for="section in filledSections" :key="section.title">
      <h4 class="studio-label mb-1.5">{{ section.title.toUpperCase() }}</h4>
      <KeyValueList :items="section.items" ratio="40%" />
    </section>

    <section v-if="sample.note">
      <h4 class="studio-label mb-1.5">NOTITIE</h4>
      <p class="text-md whitespace-pre-wrap text-body">{{ sample.note }}</p>
    </section>
  </div>
</template>
