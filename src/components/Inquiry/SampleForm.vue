<script setup lang="ts">
import { ref, watch } from 'vue'
import cloneDeep from 'lodash-es/cloneDeep'

import Card from '@/components/Common/Card.vue'
import Textarea from '@/components/Common/Inputs/Textarea.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import SampleField from '@/components/Inquiry/SampleField.vue'

import type {
  IInquirySample,
  IInquirySampleInput,
} from '@/services/fundermaps/interfaces/IInquirySample'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'
import { SAMPLE_SECTIONS } from '@/services/sampleFields'

const props = defineProps<{
  sample: IInquirySample
  saving?: boolean
}>()

const addressStore = useAddressStore()

const emit = defineEmits<{
  save: [data: IInquirySampleInput]
  delete: []
}>()

/** Editable copy. Reset whenever the parent passes a new sample. */
const form = ref<IInquirySample>(cloneDeep(props.sample))

watch(
  () => props.sample.id,
  () => {
    form.value = cloneDeep(props.sample)
  },
)

/**
 * Single write path for every registry-driven field. The per-field value union
 * on IInquirySample can't be expressed generically, so the cast is collapsed
 * here — one documented place instead of one per field.
 */
function setField(key: keyof IInquirySample, value: unknown) {
  ;(form.value as unknown as Record<string, unknown>)[key] = value
}

function onSave() {
  const { id, inquiry, building, createDate, updateDate, deleteDate, ...input } = form.value
  void id
  void inquiry
  void building
  void createDate
  void updateDate
  void deleteDate
  emit('save', input as IInquirySampleInput)
}
</script>

<template>
  <Card class="List">
    <header
      class="border-grey-200 -mx-5 -mt-5 flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4"
    >
      <div class="min-w-0 flex-1">
        <h3 class="heading-3 wrap-break-word">
          {{ formatAddress(addressStore.cache[form.address]) }}
        </h3>
        <p v-if="form.building" class="text-grey-700 text-xs">Pand: {{ form.building }}</p>
      </div>
      <div class="flex shrink-0 gap-2">
        <Button label="Verwijderen" danger @click="emit('delete')" />
        <Button label="Opslaan" type="submit" :disabled="saving" @click="onSave" />
      </div>
    </header>

    <div class="space-y-8">
      <!-- Sections, fields, labels, options and input constraints all come
           from SAMPLE_SECTIONS — the same descriptors the reviewer overview
           and the read-only view render from. -->
      <section v-for="section in SAMPLE_SECTIONS" :key="section.title">
        <h4 class="text-grey-700 mb-4 text-sm font-semibold tracking-wide uppercase">
          {{ section.title }}
        </h4>
        <div
          class="grid grid-cols-1 gap-4"
          :class="section.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'"
        >
          <SampleField
            v-for="field in section.fields"
            :key="field.key"
            :field="field"
            :model-value="form[field.key]"
            @update:model-value="(value: unknown) => setField(field.key, value)"
          />
        </div>
      </section>

      <section>
        <h4 class="text-grey-700 mb-4 text-sm font-semibold tracking-wide uppercase">Notitie</h4>
        <Textarea v-model="form.note" placeholder="Optionele notitie…" :rows="4" />
      </section>
    </div>
  </Card>
</template>
