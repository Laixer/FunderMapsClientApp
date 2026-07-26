<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import WizardHeader from '@/components/Layout/WizardHeader.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import MapPanel from '@/components/Common/MapPanel.vue'
import AddressPicker from '@/components/Inquiry/AddressPicker.vue'
import BuildingContext from '@/components/Inquiry/BuildingContext.vue'
import SampleForm from '@/components/Recovery/SampleForm.vue'

import type { SamplePin } from '@/components/Mapbox/SampleMap.vue'
import api from '@/services/fundermaps'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import type {
  IRecoverySample,
  IRecoverySampleInput,
} from '@/services/fundermaps/interfaces/IRecoverySample'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'
import { describeFailure } from '@/services/fundermaps/errors'
import { confirmAction } from '@/services/confirm'
import { RECOVERY_TYPE_LABELS } from '@/services/recoveryEnums'
import { toastError } from '@/services/toast'
import { formatAddress } from '@/utils/address'
import { formatTime } from '@/utils/date'
import { keyLabel } from '@/services/shortcuts'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { recoverySteps } from '@/services/wizard'
import { useAddressStore } from '@/stores/address'

/**
 * Step 2 of the herstel wizard — the same three-pane editor as Invoer.
 *
 * "Adressen" on the inquiry side; panden here. A recovery sample keys on the
 * BAG PAND id rather than on an address row, so the picker's resolved address
 * is cached under `building_id` and the labels come from there.
 */
const route = useRoute()
const router = useRouter()
const addressStore = useAddressStore()

const recoveryId = computed(() => Number(route.params.id))

const recovery: Ref<IRecovery | null> = ref(null)
const samples: Ref<IRecoverySample[]> = ref([])
const loading = ref(true)
const saving = ref(false)
const savedAt = ref<string | null>(null)
const buildingSearch = ref('')
const showPicker = ref(false)

const selectedId = ref<number | null>(null)
const selected = computed(() => samples.value.find((s) => s.id === selectedId.value) ?? null)

const sampleForm = ref<{ flush: () => void } | null>(null)

async function load() {
  try {
    loading.value = true
    const [r, s] = await Promise.all([
      api.recovery.getById(recoveryId.value),
      api.recoverySample.listAll(recoveryId.value),
    ])
    recovery.value = r
    samples.value = s
    // Cached by building id (PAND) — recovery samples have no address row.
    await addressStore.ensureMany(s.map((sample) => sample.building))
    if (selectedId.value === null && s.length) selectedId.value = s[0]!.id
  } catch (e) {
    toastError(describeFailure(e, 'De panden konden niet worden opgehaald.'))
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

const buildingRows = computed(() =>
  samples.value.map((sample) => ({
    id: sample.id,
    label: formatAddress(addressStore.cache[sample.building]),
    type: RECOVERY_TYPE_LABELS[sample.type] ?? 'Onbekend',
  })),
)

const visibleBuildings = computed(() => {
  const q = buildingSearch.value.trim().toLowerCase()
  if (!q) return buildingRows.value
  return buildingRows.value.filter((row) => row.label.toLowerCase().includes(q))
})

function selectSample(id: number) {
  if (id === selectedId.value) return
  sampleForm.value?.flush()
  selectedId.value = id
}

function emptyInput(buildingId: string): IRecoverySampleInput {
  return {
    address: buildingId,
    note: null,
    status: null,
    type: 5, // unknown
    pileType: null,
    facade: null,
    permit: null,
    permitDate: null,
    recoveryDate: null,
    contractor: null,
  }
}

function cloneInputFrom(source: IRecoverySample, buildingId: string): IRecoverySampleInput {
  return {
    address: buildingId,
    note: source.note,
    status: source.status,
    type: source.type,
    pileType: source.pileType,
    facade: source.facade,
    permit: source.permit,
    permitDate: source.permitDate,
    recoveryDate: source.recoveryDate,
    contractor: source.contractor,
  }
}

async function handlePick(address: IAddress) {
  sampleForm.value?.flush()
  showPicker.value = false
  saving.value = true
  // Recovery samples key on building id, not the gfm address id.
  addressStore.cache[address.building_id] = address
  try {
    const payload = selected.value
      ? cloneInputFrom(selected.value, address.building_id)
      : emptyInput(address.building_id)
    const created = await api.recoverySample.create(recoveryId.value, payload)
    samples.value = [created, ...samples.value]
    selectedId.value = created.id
  } catch (e) {
    toastError(describeFailure(e, 'Het pand kon niet worden toegevoegd.'))
  } finally {
    saving.value = false
  }
}

/** Optimistic, with a rollback to the server's copy when the write fails. */
async function handleSave(data: IRecoverySampleInput) {
  const target = selected.value
  if (!target) return

  const previous = { ...target }
  const index = samples.value.findIndex((s) => s.id === target.id)
  if (index >= 0) samples.value[index] = { ...target, ...data, building: target.building }

  saving.value = true
  try {
    await api.recoverySample.update(recoveryId.value, target.id, data)
    savedAt.value = new Date().toISOString()
  } catch (e) {
    if (index >= 0) samples.value[index] = previous
    toastError(describeFailure(e, 'Opslaan van dit pand is niet gelukt.'))
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  const target = selected.value
  if (!target) return
  const label = formatAddress(addressStore.cache[target.building])
  const ok = await confirmAction({
    title: 'Pand verwijderen?',
    body: `${label} en alle vastgelegde herstel-gegevens voor dit pand verdwijnen. Dit kan niet ongedaan worden gemaakt.`,
    confirmLabel: 'Verwijderen',
    danger: true,
  })
  if (!ok) return

  try {
    await api.recoverySample.remove(recoveryId.value, target.id)
    samples.value = samples.value.filter((s) => s.id !== target.id)
    selectedId.value = samples.value[0]?.id ?? null
  } catch (e) {
    toastError(describeFailure(e, 'Verwijderen is niet gelukt.'))
  }
}

const pins = computed<SamplePin[]>(() => {
  const sample = selected.value
  if (!sample) return []
  const address = addressStore.cache[sample.building]
  return address?.latitude != null && address.longitude != null
    ? [{ id: sample.id, lat: address.latitude, lng: address.longitude }]
    : []
})

const headerStatus = computed(() => {
  const parts = [`#${recoveryId.value}`]
  if (saving.value) parts.push('opslaan…')
  else if (savedAt.value) parts.push(`autosave ${formatTime(savedAt.value)}`)
  else parts.push('autosave aan')
  parts.push(`${keyLabel('⌘S')} om te forceren`)
  return parts.join(' · ')
})

const steps = computed(() => recoverySteps(recoveryId.value))

onBeforeRouteLeave(() => {
  sampleForm.value?.flush()
})

function previous() {
  router.push({ name: 'recovery-edit-1', params: { id: recoveryId.value } })
}

function next() {
  router.push({ name: 'recovery-edit-3', params: { id: recoveryId.value } })
}

useActionShortcuts(() => ({ '⌘S': () => sampleForm.value?.flush(), '⌘↵': next }))

watch(
  () => loading.value,
  (isLoading) => {
    if (!isLoading && samples.value.length === 0) showPicker.value = true
  },
)
</script>

<template>
  <AppShell :crumb="recovery ? `Invoer · ${recovery.documentName}` : 'Invoer'" fill>
    <WizardHeader
      :title="recovery ? `Invoer · ${recovery.documentName}` : 'Invoer'"
      :status="headerStatus"
      :steps="steps"
      :current="2"
    >
      <template #actions>
        <span class="text-base text-muted">
          {{ samples.length }} {{ samples.length === 1 ? 'pand' : 'panden' }}
        </span>
        <Button label="Vorige" @click="previous" />
        <Button variant="primary" label="Volgende" shortcut="⌘↵" @click="next" />
      </template>
    </WizardHeader>

    <div
      class="grid min-h-0 flex-1 grid-cols-[var(--spacing-addresses)_minmax(0,1fr)_var(--spacing-context)]"
    >
      <div class="flex min-h-0 flex-col overflow-y-auto border-r border-line bg-surface">
        <div class="flex flex-col gap-2 border-b border-divider px-3.5 py-3">
          <h2 class="studio-label">PANDEN ({{ samples.length }})</h2>
          <div class="flex items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-1.5">
            <span aria-hidden="true" class="text-base text-faint">⌕</span>
            <input
              v-model="buildingSearch"
              type="text"
              class="studio-control"
              placeholder="Zoek pand…"
              aria-label="Zoek in de panden van dit dossier"
            />
          </div>
        </div>

        <button
          v-for="building in visibleBuildings"
          :key="building.id"
          type="button"
          class="flex flex-col gap-1 border-b border-canvas py-2.5 pr-3.5 pl-[11px] text-left"
          :class="
            building.id === selectedId
              ? 'border-l-[3px] border-l-green bg-green-wash'
              : 'border-l-[3px] border-l-transparent hover:bg-raised'
          "
          @click="selectSample(building.id)"
        >
          <span class="text-md truncate font-semibold text-body">{{ building.label }}</span>
          <span class="text-xs text-faint">{{ building.type }}</span>
        </button>

        <p v-if="!visibleBuildings.length && buildingSearch" class="text-md px-3.5 py-3 text-muted">
          Geen pand gevonden voor “{{ buildingSearch }}”.
        </p>

        <div class="border-t border-divider px-3.5 py-3">
          <button
            v-if="!showPicker"
            type="button"
            class="text-md w-full rounded-lg border border-dashed border-line-strong bg-surface px-2.5 py-1.5 text-subtle hover:border-line-hover hover:text-strong"
            @click="showPicker = true"
          >
            + Pand toevoegen
          </button>
          <div v-else class="flex flex-col gap-2">
            <AddressPicker @pick="handlePick" />
            <button
              type="button"
              class="text-sm self-start text-subtle underline underline-offset-2"
              @click="showPicker = false"
            >
              annuleren
            </button>
          </div>
        </div>
      </div>

      <div class="min-w-0 overflow-y-auto px-5 py-4.5">
        <EmptyState v-if="loading">Panden ophalen…</EmptyState>

        <SampleForm
          v-else-if="selected"
          ref="sampleForm"
          :key="selected.id"
          :sample="selected"
          :saving="saving"
          @save="handleSave"
        />

        <EmptyState v-else dashed>
          Dit dossier heeft nog geen panden. Zoek er links één op om te beginnen.
        </EmptyState>
      </div>

      <aside class="flex min-h-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <MapPanel
          :pins="pins"
          height="250px"
          :selected-id="selectedId"
          empty-message="Geen bekende locatie voor dit pand."
        />

        <div class="flex flex-col gap-4 p-4">
          <div v-if="selected">
            <h2 class="studio-label mb-2">BEKEND OP DIT PAND</h2>
            <BuildingContext :building="selected.building" />
          </div>

          <div v-if="selected" class="border-t border-divider pt-3.5">
            <button
              type="button"
              class="text-md font-semibold text-red hover:underline"
              @click="handleDelete"
            >
              Dit pand verwijderen
            </button>
          </div>
        </div>
      </aside>
    </div>
  </AppShell>
</template>
