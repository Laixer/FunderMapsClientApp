<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Card from '@/components/Common/Card.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import AddressPicker from '@/components/Inquiry/AddressPicker.vue'
import SampleForm from '@/components/Inquiry/SampleForm.vue'
import Spinner from '@/components/Common/Spinner.vue'
import WizardSteps from '@/components/Common/WizardSteps.vue'
import SampleMap, { type SamplePin } from '@/components/Mapbox/SampleMap.vue'
import { RouterLink } from 'vue-router'

import api from '@/services/fundermaps'
import type { IInquirySample, IInquirySampleInput } from '@/services/fundermaps/interfaces/IInquirySample'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'
import { getErrorMessage } from '@/services/fundermaps/errors'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const inquiryId = computed(() => Number(route.params.id))
const addressStore = useAddressStore()

const samples: Ref<IInquirySample[]> = ref([])
const loading = ref(true)
const saving = ref(false)
const loadError: Ref<string | null> = ref(null)
const actionError: Ref<string | null> = ref(null)

const selectedId = ref<number | null>(null)
const selected = computed(() => samples.value.find((s) => s.id === selectedId.value) ?? null)

// Map markers — one per sample whose address has resolved coordinates.
// `latitude` / `longitude` come back null from the geocoder when the
// linked building has no geometry; those samples simply don't render a
// pin (the list + form still work).
const mapPins = computed<SamplePin[]>(() => {
  const out: SamplePin[] = []
  for (const s of samples.value) {
    const a = addressStore.cache[s.address]
    if (a && a.latitude != null && a.longitude != null) {
      out.push({ id: s.id, lat: a.latitude, lng: a.longitude })
    }
  }
  return out
})

function handleMapSelect(id: string | number): void {
  if (typeof id === 'number') selectSample(id)
}

async function load() {
  try {
    loading.value = true
    loadError.value = null
    samples.value = await api.inquirySample.listAll(inquiryId.value)
    await addressStore.ensureMany(samples.value.map((s) => s.address))
    if (selectedId.value === null && samples.value.length > 0) {
      selectedId.value = samples.value[0].id
    }
  } catch (e) {
    loadError.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

function selectSample(id: number) {
  selectedId.value = id
}

function emptyInput(addressId: string): IInquirySampleInput {
  return {
    address: addressId,
    note: null,
    builtYear: null,
    substructure: null,
    cpt: null,
    monitoringWell: null,
    groundwaterLevelTemp: null,
    groundLevel: null,
    groundwaterLevelNet: null,
    foundationType: null,
    enforcementTerm: null,
    recoveryAdvised: null,
    damageCause: null,
    damageCharacteristics: null,
    constructionPile: null,
    woodType: null,
    woodEncroachment: null,
    constructionLevel: null,
    woodLevel: null,
    pileDiameterTop: null,
    pileDiameterBottom: null,
    pileHeadLevel: null,
    pileTipLevel: null,
    foundationDepth: null,
    masonLevel: null,
    concreteChargerLength: null,
    pileDistanceLength: null,
    woodPenetrationDepth: null,
    overallQuality: null,
    woodQuality: null,
    constructionQuality: null,
    woodCapacityHorizontalQuality: null,
    pileWoodCapacityVerticalQuality: null,
    carryingCapacityQuality: null,
    masonQuality: null,
    woodQualityNecessity: null,
    crackIndoorRestored: null,
    crackIndoorType: null,
    crackIndoorSize: null,
    crackFacadeFrontRestored: null,
    crackFacadeFrontType: null,
    crackFacadeFrontSize: null,
    crackFacadeBackRestored: null,
    crackFacadeBackType: null,
    crackFacadeBackSize: null,
    crackFacadeLeftRestored: null,
    crackFacadeLeftType: null,
    crackFacadeLeftSize: null,
    crackFacadeRightRestored: null,
    crackFacadeRightType: null,
    crackFacadeRightSize: null,
    deformedFacade: null,
    thresholdUpdownSkewed: null,
    thresholdFrontLevel: null,
    thresholdBackLevel: null,
    skewedParallel: null,
    skewedParallelFacade: null,
    skewedPerpendicular: null,
    skewedPerpendicularFacade: null,
    settlementSpeed: null,
    skewedWindowFrame: null,
    facadeScanRisk: null,
  }
}

function cloneInputFrom(s: IInquirySample, addressId: string): IInquirySampleInput {
  const { id, inquiry, building, createDate, updateDate, deleteDate, ...rest } = s
  void id
  void inquiry
  void building
  void createDate
  void updateDate
  void deleteDate
  return { ...rest, address: addressId }
}

async function handlePick(address: IAddress) {
  saving.value = true
  actionError.value = null
  // Cache the resolved address right away so the new sample renders with
  // a human-readable label as soon as it shows up in the list.
  addressStore.cache[address.id] = address
  try {
    // Prefill from the currently-selected sample so users don't re-type
    // shared fields when adding multiple addresses to one inquiry.
    const payload = selected.value
      ? cloneInputFrom(selected.value, address.id)
      : emptyInput(address.id)
    const created = await api.inquirySample.create(inquiryId.value, payload)
    samples.value.unshift(created)
    selectedId.value = created.id
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    saving.value = false
  }
}

async function handleSave(data: IInquirySampleInput) {
  if (!selected.value) return
  saving.value = true
  actionError.value = null
  try {
    await api.inquirySample.update(inquiryId.value, selected.value.id, data)
    const fresh = await api.inquirySample.getById(inquiryId.value, selected.value.id)
    const idx = samples.value.findIndex((s) => s.id === fresh.id)
    if (idx >= 0) samples.value[idx] = fresh
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!selected.value) return
  const label = formatAddress(addressStore.cache[selected.value.address])
  if (!confirm(`Adres "${label}" verwijderen?`)) return
  saving.value = true
  actionError.value = null
  try {
    await api.inquirySample.remove(inquiryId.value, selected.value.id)
    const removedId = selected.value.id
    samples.value = samples.value.filter((s) => s.id !== removedId)
    selectedId.value = samples.value[0]?.id ?? null
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    saving.value = false
  }
}

function next() {
  router.push({ name: 'inquiry-edit-3', params: { id: inquiryId.value } })
}

function previous() {
  router.push({ name: 'inquiry-edit-1', params: { id: inquiryId.value } })
}
</script>

<template>
  <MainWrapper>
    <div class="mb-8 space-y-3">
      <RouterLink
        :to="{ name: 'inquiry-list' }"
        class="inline-flex items-center gap-1 text-xs font-medium text-grey-700 hover:text-grey-800"
      >
        ← {{ t('inquiry.view.back') }}
      </RouterLink>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-2xl font-semibold text-grey-800">Adressen</h2>
          <p class="mt-0.5 text-sm text-grey-700">
            Zoek adressen en vul per locatie de bevindingen in.
          </p>
        </div>
        <div class="flex gap-2">
          <Button lg outline label="Vorige" @click="previous" />
          <Button lg label="Volgende" @click="next" />
        </div>
      </div>
      <WizardSteps :steps="['Gegevens', 'Adressen', 'Controle']" :current="2" />
    </div>

    <Alert v-if="loadError" :closeable="true" class="mb-3" @close="loadError = null">
      {{ loadError }}
    </Alert>
    <Alert v-if="actionError" :closeable="true" class="mb-3" @close="actionError = null">
      {{ actionError }}
    </Alert>

    <Card v-if="loading" class="flex justify-center py-8">
      <Spinner />
      <span v-if="false">{{ t('common.loading') }}</span>
    </Card>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-1 !p-0">
        <header class="border-b border-grey-200 px-4 py-3">
          <h3 class="text-sm font-semibold text-grey-800">Adressen ({{ samples.length }})</h3>
          <p class="mt-0.5 text-xs text-grey-700">
            Zoek een adres en klik op een suggestie om toe te voegen.
          </p>
        </header>

        <div class="px-4 py-3">
          <AddressPicker @pick="handlePick" />
        </div>

        <ul v-if="samples.length" class="divide-y divide-grey-200 border-t border-grey-200">
          <li
            v-for="s in samples"
            :key="s.id"
            class="cursor-pointer px-4 py-2 text-sm transition-colors"
            :class="
              s.id === selectedId
                ? 'bg-grey-100 font-semibold text-grey-800'
                : 'text-grey-800 hover:bg-grey-100'
            "
            @click="selectSample(s.id)"
          >
            {{ formatAddress(addressStore.cache[s.address]) }}
          </li>
        </ul>
        <p v-else class="border-t border-grey-200 px-4 py-3 text-sm text-grey-700">
          Nog geen adressen. Begin hierboven met zoeken.
        </p>
      </Card>

      <div class="space-y-4 lg:col-span-2">
        <!-- Bordered div, not <Card> — Card's body div has auto height, so a
             child with `h-full` collapses to 0 and Mapbox renders a 0x0 canvas
             with no error. Putting the explicit `h-64` on the direct parent
             of SampleMap gives mapbox-gl the dimensions it needs at init. -->
        <div
          v-if="mapPins.length"
          class="h-64 overflow-hidden rounded-md border border-grey-200 bg-white"
        >
          <SampleMap :pins="mapPins" :selected-id="selectedId" @select="handleMapSelect" />
        </div>

        <Card v-if="!selected" class="flex items-center justify-center py-12">
          <p class="text-sm text-grey-700">Selecteer een adres om te bewerken.</p>
        </Card>
        <SampleForm
          v-else
          :sample="selected"
          :saving="saving"
          @save="handleSave"
          @delete="handleDelete"
        />
      </div>
    </div>
  </MainWrapper>
</template>
