<script setup lang="ts">
import { computed, onBeforeMount, reactive, ref, watch, type Ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppShell from '@/components/Layout/AppShell.vue'
import WizardHeader from '@/components/Layout/WizardHeader.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import MapPanel from '@/components/Common/MapPanel.vue'
import ProgressBar from '@/components/Common/ProgressBar.vue'
import AddressPicker from '@/components/Inquiry/AddressPicker.vue'
import BuildingContext from '@/components/Inquiry/BuildingContext.vue'
import SampleForm from '@/components/Inquiry/SampleForm.vue'

import type { SamplePin } from '@/components/Mapbox/SampleMap.vue'
import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import type {
  IInquirySample,
  IInquirySampleInput,
} from '@/services/fundermaps/interfaces/IInquirySample'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'
import { describeFailure } from '@/services/fundermaps/errors'
import { confirmAction } from '@/services/confirm'
import { inheritedFrom, type SampleProvenance } from '@/services/sampleProvenance'
import {
  SAMPLE_FIELD_COUNT,
  countFilledSampleFields,
  sampleCompleteness,
} from '@/services/sampleFields'
import { findingsFor } from '@/services/sampleValidation'
import { toastError } from '@/services/toast'
import { formatAddress } from '@/utils/address'
import { formatTime } from '@/utils/date'
import { keyLabel } from '@/services/shortcuts'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { inquirySteps } from '@/services/wizard'
import { useAddressStore } from '@/stores/address'

/**
 * Invoer — the wizard's second step, rebuilt as a three-pane editor.
 *
 * Addresses on the left, the form in the middle, the building's context on the
 * right. All three scroll independently under a header that never moves, so
 * working through a terrace is one continuous motion instead of a page load per
 * house.
 *
 * The right pane is the part that changes how the job feels. It holds what is
 * already known about *this pand* — earlier QuickScans, a completed repair, an
 * open terugmelding — and any cross-field findings, written as sentences. Both
 * used to be things you found out later, from a reviewer.
 *
 * Saving is automatic and per-field (see `SampleForm`). Navigation flushes a
 * pending write but never waits for it: nothing here should ever make someone
 * sit and watch a spinner before they can look at the next address.
 */
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const addressStore = useAddressStore()

const inquiryId = computed(() => Number(route.params.id))

const inquiry: Ref<IInquiry | null> = ref(null)
const samples: Ref<IInquirySample[]> = ref([])
const loading = ref(true)
const saving = ref(false)
const savedAt = ref<string | null>(null)
const addressSearch = ref('')
const showPicker = ref(false)

const selectedId = ref<number | null>(null)
const selected = computed(() => samples.value.find((s) => s.id === selectedId.value) ?? null)

/**
 * What the form currently holds for the selected address, saved or not. The
 * list copy (`selected`) is rolled back when a write fails, which used to take
 * the finding that explained the failure with it — the person saw a red toast
 * and a field that looked fine (#1012). Findings read from here instead.
 */
const draft = ref<IInquirySample | null>(null)
watch(selectedId, () => {
  draft.value = null
})

const sampleForm = ref<{ flush: () => void } | null>(null)

/**
 * Per-sample record of which fields were prefilled from another address rather
 * than entered for this one. Held here rather than in the form so it survives
 * switching between addresses; it lives for the session only, until phase 2
 * persists it on the sample.
 */
const provenanceBySample = reactive<Record<number, SampleProvenance>>({})

/* ------------------------------------------------------------------- load */

async function load() {
  try {
    loading.value = true
    const [i, s] = await Promise.all([
      api.inquiry.getById(inquiryId.value),
      api.inquirySample.listAll(inquiryId.value),
    ])
    inquiry.value = i
    samples.value = s
    await addressStore.ensureMany(s.map((sample) => sample.address))
    if (selectedId.value === null && s.length) selectedId.value = s[0]!.id
  } catch (e) {
    toastError(describeFailure(e, 'De adressen konden niet worden opgehaald.'))
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

/* -------------------------------------------------------------- left pane */

const addressRows = computed(() =>
  samples.value.map((sample) => ({
    id: sample.id,
    label: formatAddress(addressStore.cache[sample.address]),
    filled: countFilledSampleFields(sample),
    ratio: sampleCompleteness(sample),
  })),
)

const visibleAddresses = computed(() => {
  const q = addressSearch.value.trim().toLowerCase()
  if (!q) return addressRows.value
  return addressRows.value.filter((row) => row.label.toLowerCase().includes(q))
})

/**
 * Switching address flushes whatever is pending and moves on. It does not ask,
 * because with autosave there is nothing to lose — which is the entire reason
 * the "wijzigingen niet opslaan?" dialog is gone.
 */
function selectSample(id: number) {
  if (id === selectedId.value) return
  sampleForm.value?.flush()
  selectedId.value = id
}

/* ------------------------------------------------------------------ writes */

/**
 * A sample with nothing filled in.
 *
 * Every nullable column is listed explicitly because create and update are full
 * replacements: an omitted key is not "leave it alone", it is "no value", and
 * the API validates the ones it expects to see. The list is spelled out rather
 * than derived from `SAMPLE_SECTIONS` because it is the *wire* shape — it has
 * to stay right even for a column the form has not started rendering yet.
 */
const BLANK_SAMPLE: Record<string, null> = Object.fromEntries(
  [
    'note',
    'builtYear',
    'substructure',
    'cpt',
    'monitoringWell',
    'groundwaterLevelTemp',
    'groundLevel',
    'groundwaterLevelNet',
    'foundationType',
    'enforcementTerm',
    'recoveryAdvised',
    'damageCause',
    'damageCharacteristics',
    'constructionPile',
    'woodType',
    'woodEncroachment',
    'constructionLevel',
    'woodLevel',
    'pileDiameterTop',
    'pileDiameterBottom',
    'pileHeadLevel',
    'pileTipLevel',
    'foundationDepth',
    'masonLevel',
    'concreteChargerLength',
    'pileDistanceLength',
    'woodPenetrationDepth',
    'overallQuality',
    'woodQuality',
    'constructionQuality',
    'woodCapacityHorizontalQuality',
    'pileWoodCapacityVerticalQuality',
    'carryingCapacityQuality',
    'masonQuality',
    'woodQualityNecessity',
    'crackIndoorRestored',
    'crackIndoorType',
    'crackIndoorSize',
    'crackFacadeFrontRestored',
    'crackFacadeFrontType',
    'crackFacadeFrontSize',
    'crackFacadeBackRestored',
    'crackFacadeBackType',
    'crackFacadeBackSize',
    'crackFacadeLeftRestored',
    'crackFacadeLeftType',
    'crackFacadeLeftSize',
    'crackFacadeRightRestored',
    'crackFacadeRightType',
    'crackFacadeRightSize',
    'deformedFacade',
    'thresholdUpdownSkewed',
    'thresholdFrontLevel',
    'thresholdBackLevel',
    'skewedParallel',
    'skewedParallelFacade',
    'skewedPerpendicular',
    'skewedPerpendicularFacade',
    'settlementSpeed',
    'skewedWindowFrame',
    'facadeScanRisk',
  ].map((key) => [key, null]),
)

function emptyInput(addressId: string): IInquirySampleInput {
  return { ...BLANK_SAMPLE, address: addressId } as unknown as IInquirySampleInput
}

function cloneInputFrom(source: IInquirySample, addressId: string): IInquirySampleInput {
  const { id, inquiry: _inquiry, building, createDate, updateDate, deleteDate, ...rest } = source
  void id
  void _inquiry
  void building
  void createDate
  void updateDate
  void deleteDate
  return { ...rest, address: addressId }
}

async function handlePick(address: IAddress) {
  sampleForm.value?.flush()
  showPicker.value = false
  saving.value = true

  // Cache the resolved address right away so the new sample renders with a
  // human-readable label as soon as it shows up in the list.
  addressStore.cache[address.id] = address

  try {
    // Prefill from the currently-selected sample so nobody re-types the shared
    // fields across a terrace of near-identical houses.
    const source = selected.value
    const payload = source ? cloneInputFrom(source, address.id) : emptyInput(address.id)
    const created = await api.inquirySample.create(inquiryId.value, payload)
    // Record what the prefill carried across, so the form can show which values
    // describe this address and which merely rode along.
    if (source) {
      provenanceBySample[created.id] = inheritedFrom(payload, {
        id: source.id,
        address: formatAddress(addressStore.cache[source.address]),
      })
    }
    samples.value = [created, ...samples.value]
    selectedId.value = created.id
  } catch (e) {
    toastError(describeFailure(e, 'Het adres kon niet worden toegevoegd.'))
  } finally {
    saving.value = false
  }
}

/**
 * Optimistic: the edited values go into the list immediately so the completeness
 * counts move as you type, and are rolled back to the server's copy if the
 * write fails.
 */
async function handleSave(data: IInquirySampleInput) {
  const target = selected.value
  if (!target) return

  const previous = { ...target }
  const index = samples.value.findIndex((s) => s.id === target.id)
  if (index >= 0) samples.value[index] = { ...target, ...data }

  saving.value = true
  try {
    await api.inquirySample.update(inquiryId.value, target.id, data)
    savedAt.value = new Date().toISOString()
  } catch (e) {
    if (index >= 0) samples.value[index] = previous
    toastError(describeFailure(e, 'Opslaan van dit adres is niet gelukt.'))
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  const target = selected.value
  if (!target) return
  const label = formatAddress(addressStore.cache[target.address])
  const ok = await confirmAction({
    title: 'Adres verwijderen?',
    body: `${label} en alle ingevoerde waarnemingen voor dit adres verdwijnen. Dit kan niet ongedaan worden gemaakt.`,
    confirmLabel: 'Verwijderen',
    danger: true,
  })
  if (!ok) return

  try {
    await api.inquirySample.remove(inquiryId.value, target.id)
    delete provenanceBySample[target.id]
    samples.value = samples.value.filter((s) => s.id !== target.id)
    selectedId.value = samples.value[0]?.id ?? null
  } catch (e) {
    toastError(describeFailure(e, 'Verwijderen is niet gelukt.'))
  }
}

/* ------------------------------------------------------------- right pane */

const findings = computed(() =>
  selected.value
    ? findingsFor(draft.value ?? selected.value, {
        inquiryType: inquiry.value?.type,
        documentDate: inquiry.value?.documentDate,
        bagBuiltYear: addressStore.cache[selected.value.address]?.built_year,
      })
    : [],
)

const pins = computed<SamplePin[]>(() => {
  const sample = selected.value
  if (!sample) return []
  const address = addressStore.cache[sample.address]
  // Coordinates come back null when the linked building has no geometry.
  return address?.latitude != null && address.longitude != null
    ? [{ id: sample.id, lat: address.latitude, lng: address.longitude }]
    : []
})

/* ----------------------------------------------------------------- header */

const totals = computed(() => ({
  filled: samples.value.reduce((n, s) => n + countFilledSampleFields(s), 0),
  possible: samples.value.length * SAMPLE_FIELD_COUNT,
}))

const headerStatus = computed(() => {
  const parts = [`#${inquiryId.value}`]
  if (saving.value) parts.push('opslaan…')
  else if (savedAt.value) parts.push(`autosave ${formatTime(savedAt.value)}`)
  else parts.push('autosave aan')
  parts.push(`${keyLabel('⌘S')} om te forceren`)
  return parts.join(' · ')
})

const steps = computed(() => inquirySteps(inquiryId.value))

// Leaving flushes what is pending, then goes. It does not wait for the request:
// a save in flight will land whether or not this view is still mounted.
onBeforeRouteLeave(() => {
  sampleForm.value?.flush()
})

function previous() {
  router.push({ name: 'inquiry-edit-1', params: { id: inquiryId.value } })
}

function next() {
  router.push({ name: 'inquiry-edit-3', params: { id: inquiryId.value } })
}

useActionShortcuts(() => ({
  '⌘S': () => sampleForm.value?.flush(),
  '⌘↵': next,
}))

// A dossier with no addresses opens straight into the picker: there is nothing
// else to do on this screen, and hiding the only action behind a button would
// just be a click.
watch(
  () => loading.value,
  (isLoading) => {
    if (!isLoading && samples.value.length === 0) showPicker.value = true
  },
)
</script>

<template>
  <AppShell :crumb="inquiry ? `Invoer · ${inquiry.documentName}` : 'Invoer'" fill>
    <WizardHeader
      :title="inquiry ? `Invoer · ${inquiry.documentName}` : 'Invoer'"
      :status="headerStatus"
      :steps="steps"
      :current="2"
    >
      <template #actions>
        <span class="text-base text-muted">
          {{ totals.filled }} / {{ totals.possible }} velden
        </span>
        <Button label="Vorige" @click="previous" />
        <Button variant="primary" label="Volgende" shortcut="⌘↵" @click="next" />
      </template>
    </WizardHeader>

    <div
      class="grid min-h-0 flex-1 grid-cols-[var(--spacing-addresses)_minmax(0,1fr)_var(--spacing-context)]"
    >
      <!-- Left: the addresses in this dossier -->
      <div class="flex min-h-0 flex-col overflow-y-auto border-r border-line bg-surface">
        <div class="flex flex-col gap-2 border-b border-divider px-3.5 py-3">
          <h2 class="studio-label">ADRESSEN ({{ samples.length }})</h2>
          <div class="flex items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-1.5">
            <span aria-hidden="true" class="text-base text-faint">⌕</span>
            <input
              v-model="addressSearch"
              type="text"
              class="studio-control"
              placeholder="Zoek adres…"
              aria-label="Zoek in de adressen van dit dossier"
            />
          </div>
        </div>

        <button
          v-for="address in visibleAddresses"
          :key="address.id"
          type="button"
          class="flex flex-col gap-1.5 border-b border-canvas px-3.5 py-2.5 text-left"
          :class="
            address.id === selectedId
              ? 'border-l-[3px] border-l-green bg-green-wash pl-[11px]'
              : 'border-l-[3px] border-l-transparent pl-[11px] hover:bg-raised'
          "
          @click="selectSample(address.id)"
        >
          <span class="text-md truncate font-semibold text-body">{{ address.label }}</span>
          <span
            class="text-xs font-mono"
            :class="address.filled ? 'text-green-ink' : 'text-red'"
          >
            {{ address.filled }} velden
          </span>
          <ProgressBar
            :value="address.ratio"
            :tone="address.filled ? 'green' : 'red'"
            :label="address.label"
          />
        </button>

        <p
          v-if="!visibleAddresses.length && addressSearch"
          class="text-md px-3.5 py-3 text-muted"
        >
          Geen adres gevonden voor “{{ addressSearch }}”.
        </p>

        <div class="border-t border-divider px-3.5 py-3">
          <button
            v-if="!showPicker"
            type="button"
            class="text-md w-full rounded-lg border border-dashed border-line-strong bg-surface px-2.5 py-1.5 text-subtle hover:border-line-hover hover:text-strong"
            @click="showPicker = true"
          >
            + Adres toevoegen
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

      <!-- Centre: the form for the selected address -->
      <div class="min-w-0 overflow-y-auto px-5 py-4.5">
        <template v-if="loading">
          <EmptyState>Adressen ophalen…</EmptyState>
        </template>

        <SampleForm
          v-else-if="selected"
          ref="sampleForm"
          :key="selected.id"
          v-model:provenance="provenanceBySample[selected.id]"
          :sample="selected"
          :findings="findings"
          :saving="saving"
          @save="handleSave"
          @draft="draft = $event"
        />

        <EmptyState v-else dashed>
          Dit dossier heeft nog geen adressen. Zoek er links één op om te beginnen.
        </EmptyState>
      </div>

      <!-- Right: where this pand is, and what is already known about it -->
      <aside class="flex min-h-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <MapPanel
          :pins="pins"
          height="250px"
          :selected-id="selectedId"
          empty-message="Geen bekende locatie voor dit adres."
        />

        <div class="flex flex-col gap-4 p-4">
          <div v-if="selected">
            <h2 class="studio-label mb-2">BEKEND OP DIT PAND</h2>
            <BuildingContext :building="selected.building" :exclude-inquiry="inquiryId" />
          </div>

          <!-- Cross-field findings, as sentences. Never blocking: the
               Netherlands has genuinely strange buildings in it, and a tool
               that refuses to record what the report says is a tool people
               work around. -->
          <Callout
            v-for="finding in findings"
            :key="finding.id"
            tone="amber"
            title="Controleer dit"
          >
            {{ finding.message }}
          </Callout>

          <div v-if="selected" class="border-t border-divider pt-3.5">
            <button
              type="button"
              class="text-md font-semibold text-red hover:underline"
              @click="handleDelete"
            >
              {{ t('sample.removeAddress') }}
            </button>
          </div>
        </div>
      </aside>
    </div>
  </AppShell>
</template>
