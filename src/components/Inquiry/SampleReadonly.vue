<script setup lang="ts">
import { computed } from 'vue'

import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import {
  SAMPLE_SECTIONS,
  isSampleFieldFilled,
  type SampleFieldDef,
} from '@/services/sampleFields'
import { formatDate } from '@/utils/date'

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
    fields: section.fields.filter((f) => isSampleFieldFilled(props.sample[f.key])),
  })).filter((section) => section.fields.length > 0),
)

const isEmpty = computed(() => filledSections.value.length === 0 && !props.sample.note)
</script>

<template>
  <p v-if="isEmpty" class="text-sm text-grey-700">Geen velden ingevuld.</p>
  <div v-else class="space-y-5">
    <section v-for="section in filledSections" :key="section.title">
      <h5 class="mb-2 text-xs font-semibold uppercase tracking-wide text-grey-700">
        {{ section.title }}
      </h5>
      <dl class="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[minmax(16rem,22rem)_1fr]">
        <template v-for="field in section.fields" :key="field.key">
          <dt class="text-grey-700">{{ field.label }}</dt>
          <dd class="text-grey-800">{{ display(field) }}</dd>
        </template>
      </dl>
    </section>
    <section v-if="sample.note">
      <h5 class="mb-2 text-xs font-semibold uppercase tracking-wide text-grey-700">Notitie</h5>
      <p class="whitespace-pre-wrap text-sm text-grey-800">{{ sample.note }}</p>
    </section>
  </div>
</template>
