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
    <Card class="List col-span-3 mt-16">
      <header
        class="-mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
      >
        <h2 class="heading-3">Rapportage — adressen (stap 2 van 3)</h2>
        <div class="flex gap-2">
          <Button label="Vorige" outline @click="previous" />
          <Button label="Volgende" @click="next" />
        </div>
      </header>

      <Alert v-if="loadError" :closeable="true" @close="loadError = null">{{ loadError }}</Alert>
      <Alert v-if="actionError" :closeable="true" @close="actionError = null">{{
        actionError
      }}</Alert>

      <Spinner v-if="loading" />
      <span v-if="false">{{ t('common.loading') }}</span>
    </Card>

    <template v-if="!loading">
      <Card class="List col-span-3 lg:col-span-1">
        <header class="-mx-5 -mt-5 border-b border-grey-200 px-5 py-4">
          <h3 class="heading-3">Adressen</h3>
          <p class="mt-1 text-xs text-grey-700">
            Zoek het adres en klik op een suggestie om toe te voegen.
          </p>
        </header>

        <AddressPicker @pick="handlePick" />

        <ul v-if="samples.length" class="divide-y divide-grey-200">
          <li
            v-for="s in samples"
            :key="s.id"
            class="cursor-pointer px-2 py-2 text-sm hover:bg-grey-100"
            :class="s.id === selectedId ? 'bg-green-100 font-semibold' : 'text-grey-800'"
            @click="selectSample(s.id)"
          >
            {{ formatAddress(addressStore.cache[s.address]) }}
          </li>
        </ul>
        <p v-else class="text-sm text-grey-700">Nog geen adressen. Begin hierboven met zoeken.</p>
      </Card>

      <Card v-if="!selected" class="List col-span-3 lg:col-span-2">
        <p class="text-sm text-grey-700">Selecteer een adres om te bewerken.</p>
      </Card>
      <SampleForm
        v-else
        :sample="selected"
        :saving="saving"
        @save="handleSave"
        @delete="handleDelete"
      />
    </template>
  </MainWrapper>
</template>
