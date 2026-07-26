<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'

import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'
import Pill from '@/components/Common/Pill.vue'
import ToggleChip from '@/components/Common/ToggleChip.vue'

import api from '@/services/fundermaps'
import type { IContractor } from '@/services/fundermaps/interfaces/IContractor'
import type {
  IRecoverySample,
  IRecoverySampleInput,
} from '@/services/fundermaps/interfaces/IRecoverySample'
import type { SelectOption } from '@/services/options'
import {
  RECOVERY_STATUS_OPTIONS,
  RECOVERY_TYPE_OPTIONS,
  PILE_TYPE_OPTIONS,
  FACADE_OPTIONS,
} from '@/services/recoveryEnums'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'

/**
 * One building's worth of repair details, autosaved as you type.
 *
 * Same contract as the inquiry form: the parent owns the writing, this owns the
 * editing, and `flush()` exists so navigation can push a pending save out
 * without waiting on it. Far fewer fields than an inquiry sample — a repair is
 * a handful of facts about work that was done, not a survey.
 */
const props = defineProps<{
  sample: IRecoverySample
  /** True while a write for this sample is in flight. */
  saving?: boolean
}>()

const emit = defineEmits<{ save: [data: IRecoverySampleInput] }>()

const addressStore = useAddressStore()
const contractors: Ref<IContractor[]> = ref([])

/** Editable copy. Reset whenever the parent passes a different sample. */
const form = ref<IRecoverySample>({ ...props.sample })

const AUTOSAVE_MS = 600
let timer: ReturnType<typeof setTimeout> | null = null
const dirty = ref(false)

function payload(): IRecoverySampleInput {
  return {
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
  }
}

function schedule() {
  dirty.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    dirty.value = false
    emit('save', payload())
  }, AUTOSAVE_MS)
}

function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!dirty.value) return
  dirty.value = false
  emit('save', payload())
}

defineExpose({ flush })

watch(
  () => props.sample.id,
  () => {
    // Switching building must not carry the outgoing one's pending write into
    // the incoming one's payload.
    flush()
    form.value = { ...props.sample }
  },
)

// Every control writes through here, so scheduling a save can never be
// forgotten on a field added later.
function set<K extends keyof IRecoverySample>(key: K, value: IRecoverySample[K]) {
  form.value[key] = value
  schedule()
}

const contractorOptions = computed<SelectOption[]>(() =>
  contractors.value.map((c) => ({ value: c.id, label: c.name })),
)

function isFacadeOn(value: number): boolean {
  return (form.value.facade ?? []).includes(value)
}

function toggleFacade(value: number) {
  const current = new Set(form.value.facade ?? [])
  if (current.has(value)) current.delete(value)
  else current.add(value)
  set(
    'facade',
    Array.from(current).sort((a, b) => a - b),
  )
}

onBeforeMount(async () => {
  try {
    contractors.value = await api.contractor.list()
  } catch {
    // The contractor list is a convenience here; losing it costs one dropdown.
  }
})

const addressLabel = computed(() => formatAddress(addressStore.cache[form.value.building]))

const saveState = computed(() => {
  if (props.saving) return { label: 'Opslaan…', tone: 'blue' as const }
  if (dirty.value) return { label: 'Niet opgeslagen', tone: 'amber' as const }
  return { label: 'Opgeslagen', tone: 'green' as const }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <header class="flex items-center gap-3">
      <div class="min-w-0">
        <h2 class="text-3xl font-display font-bold break-words text-ink">{{ addressLabel }}</h2>
        <p v-if="form.building" class="text-xs font-mono text-faint">{{ form.building }}</p>
      </div>
      <Pill class="ml-auto" :label="saveState.label" :tone="saveState.tone" />
    </header>

    <Panel caption="HERSTEL">
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field
          :model-value="form.type"
          label="Hersteltype"
          kind="select"
          required
          :options="RECOVERY_TYPE_OPTIONS"
          empty-label="—"
          @update:model-value="(v: unknown) => set('type', (v ?? 5) as number)"
        />
        <Field
          :model-value="form.status"
          label="Status"
          kind="select"
          :options="RECOVERY_STATUS_OPTIONS"
          empty-label="—"
          @update:model-value="(v: unknown) => set('status', v as number | null)"
        />
        <Field
          :model-value="form.pileType"
          label="Type funderingsbalk"
          kind="select"
          :options="PILE_TYPE_OPTIONS"
          empty-label="—"
          @update:model-value="(v: unknown) => set('pileType', v as number | null)"
        />
        <Field
          :model-value="form.contractor"
          label="Uitvoerder"
          kind="select"
          :options="contractorOptions"
          empty-label="—"
          @update:model-value="(v: unknown) => set('contractor', v as number | null)"
        />
      </div>
    </Panel>

    <Panel caption="GEVELS">
      <!-- Four chips rather than four checkboxes: this is one question with a
           multiple answer ("which facades were done"), and chips read as a set.
           `items-start` keeps each chip the width of its own label. -->
      <div class="flex flex-wrap items-start gap-2">
        <ToggleChip
          v-for="option in FACADE_OPTIONS"
          :key="option.value"
          :model-value="isFacadeOn(option.value)"
          :label="option.label"
          @update:model-value="toggleFacade(option.value)"
        />
      </div>
    </Panel>

    <Panel caption="VERGUNNING">
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field
          :model-value="form.permit"
          label="Vergunningnummer"
          mono
          @update:model-value="(v: unknown) => set('permit', v as string | null)"
        />
        <Field
          :model-value="form.permitDate"
          label="Vergunningdatum"
          kind="date"
          @update:model-value="(v: unknown) => set('permitDate', v as string | null)"
        />
        <Field
          :model-value="form.recoveryDate"
          label="Uitvoeringsdatum"
          kind="date"
          @update:model-value="(v: unknown) => set('recoveryDate', v as string | null)"
        />
      </div>
    </Panel>

    <Panel caption="NOTITIE">
      <Field
        :model-value="form.note"
        kind="textarea"
        :rows="4"
        placeholder="Optionele notitie bij dit pand…"
        @update:model-value="(v: unknown) => set('note', v as string | null)"
      />
    </Panel>
  </div>
</template>
