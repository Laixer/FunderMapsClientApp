<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import cloneDeep from 'lodash-es/cloneDeep'

import Card from '@/components/Common/Card.vue'
import Input from '@/components/Common/Inputs/Input.vue'
import Select from '@/components/Common/Inputs/Select.vue'
import CheckBox from '@/components/Common/Inputs/CheckBox.vue'
import Textarea from '@/components/Common/Inputs/Textarea.vue'
import Button from '@/components/Common/Buttons/Button.vue'

import api from '@/services/fundermaps'
import type { IContractor } from '@/services/fundermaps/interfaces/IContractor'
import type {
  IRecoverySample,
  IRecoverySampleInput,
} from '@/services/fundermaps/interfaces/IRecoverySample'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'
import {
  RECOVERY_STATUS_OPTIONS,
  RECOVERY_TYPE_OPTIONS,
  PILE_TYPE_OPTIONS,
  FACADE_OPTIONS,
} from '@/services/recoveryEnums'

const props = defineProps<{
  sample: IRecoverySample
  saving?: boolean
}>()

const addressStore = useAddressStore()

const emit = defineEmits<{
  save: [data: IRecoverySampleInput]
  delete: []
}>()

const contractors: Ref<IContractor[]> = ref([])

/** Editable copy. Reset whenever the parent passes a new sample. */
const form = ref<IRecoverySample>(cloneDeep(props.sample))

watch(
  () => props.sample.id,
  () => {
    form.value = cloneDeep(props.sample)
  },
)

const contractorOptions = computed(() =>
  contractors.value.map((c) => ({ value: c.id, label: c.name })),
)

const facadeSet = computed({
  get: () => new Set(form.value.facade ?? []),
  set: (v: Set<number>) => {
    form.value.facade = Array.from(v).sort((a, b) => a - b)
  },
})

function toggleFacade(value: number) {
  const next = new Set(facadeSet.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  facadeSet.value = next
}

function isFacadeChecked(value: number): boolean {
  return facadeSet.value.has(value)
}

onBeforeMount(async () => {
  try {
    contractors.value = await api.contractor.list()
  } catch {
    /* contractor list is non-critical here */
  }
})

function onSave() {
  emit('save', {
    address: form.value.building,
    note: form.value.note,
    status: form.value.status,
    type: form.value.type,
    pileType: form.value.pileType,
    facade: form.value.facade,
    permit: form.value.permit,
    permitDate: form.value.permitDate,
    recoveryDate: form.value.recoveryDate,
    contractor: form.value.contractor,
  })
}
</script>

<template>
  <Card class="List col-span-3 lg:col-span-2">
    <header
      class="-mx-5 -mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
    >
      <div class="min-w-0 flex-1">
        <h3 class="heading-3 break-words">
          {{ formatAddress(addressStore.cache[form.building]) }}
        </h3>
        <p v-if="form.building" class="text-xs text-grey-700">Pand: {{ form.building }}</p>
      </div>
      <div class="flex flex-shrink-0 gap-2">
        <Button label="Verwijderen" danger @click="emit('delete')" />
        <Button label="Opslaan" type="submit" :disabled="saving" @click="onSave" />
      </div>
    </header>

    <div class="space-y-8">
      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Herstel
        </h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            v-model="form.type"
            label="Hersteltype"
            :options="RECOVERY_TYPE_OPTIONS"
            placeholder="-"
            required
          />
          <Select
            v-model="form.status"
            label="Status"
            :options="RECOVERY_STATUS_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.pileType"
            label="Paaltype"
            :options="PILE_TYPE_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.contractor"
            label="Uitvoerder"
            :options="contractorOptions"
            placeholder="-"
          />
        </div>
      </section>

      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Gevels
        </h4>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CheckBox
            v-for="opt in FACADE_OPTIONS"
            :key="opt.value"
            :modelValue="isFacadeChecked(opt.value)"
            :label="opt.label"
            @update:modelValue="toggleFacade(opt.value)"
          />
        </div>
      </section>

      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Vergunning
        </h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input v-model="form.permit" label="Vergunningnummer" />
          <Input v-model="form.permitDate" label="Vergunningdatum" type="date" />
          <Input v-model="form.recoveryDate" label="Uitvoeringsdatum" type="date" />
        </div>
      </section>

      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Notitie
        </h4>
        <Textarea v-model="form.note" placeholder="Optionele notitie…" :rows="4" />
      </section>
    </div>
  </Card>
</template>
