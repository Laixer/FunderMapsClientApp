<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()

const contractors: Ref<IContractor[]> = ref([])

/** Editable copy. Reset whenever the parent passes a new sample. */
const form = ref<IRecoverySample>(cloneDeep(props.sample))

/**
 * The last state known to be on the server. Comparison beats a manual flag: no
 * field can be added later and forgotten. Same mechanism as the inquiry form.
 */
const baseline = ref<string>(JSON.stringify(props.sample))

const isDirty = computed(() => JSON.stringify(form.value) !== baseline.value)

defineExpose({ isDirty })

watch(
  () => props.sample.id,
  () => {
    form.value = cloneDeep(props.sample)
    baseline.value = JSON.stringify(props.sample)
  },
)

watch(
  () => props.sample,
  (sample) => {
    if (sample.id === form.value.id) baseline.value = JSON.stringify(sample)
  },
  { deep: true },
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
      class="border-grey-200 -mx-5 -mt-5 flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4"
    >
      <div class="min-w-0 flex-1">
        <h3 class="heading-3 wrap-break-word">
          {{ formatAddress(addressStore.cache[form.building]) }}
        </h3>
        <p v-if="form.building" class="text-grey-700 text-xs">Pand: {{ form.building }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span
          v-if="isDirty"
          class="text-grey-700 flex items-center gap-1.5 text-xs"
          :title="t('sample.unsavedHint')"
        >
          <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
          {{ t('sample.unsaved') }}
        </span>
        <Button label="Verwijderen" danger @click="emit('delete')" />
        <Button label="Opslaan" type="submit" :disabled="saving || !isDirty" @click="onSave" />
      </div>
    </header>

    <div class="space-y-8">
      <section>
        <h4 class="text-grey-700 mb-4 text-sm font-semibold tracking-wide uppercase">Herstel</h4>
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
            label="Type funderingsbalk"
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
        <h4 class="text-grey-700 mb-4 text-sm font-semibold tracking-wide uppercase">Gevels</h4>
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
        <h4 class="text-grey-700 mb-4 text-sm font-semibold tracking-wide uppercase">Vergunning</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input v-model="form.permit" label="Vergunningnummer" />
          <Input v-model="form.permitDate" label="Vergunningdatum" type="date" />
          <Input v-model="form.recoveryDate" label="Uitvoeringsdatum" type="date" />
        </div>
      </section>

      <section>
        <h4 class="text-grey-700 mb-4 text-sm font-semibold tracking-wide uppercase">Notitie</h4>
        <Textarea v-model="form.note" placeholder="Optionele notitie…" :rows="4" />
      </section>
    </div>
  </Card>
</template>
