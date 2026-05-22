<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Card from '@/components/Common/Card.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import AddressPicker from '@/components/Inquiry/AddressPicker.vue'
import SampleForm from '@/components/Recovery/SampleForm.vue'
import Spinner from '@/components/Common/Spinner.vue'

import api from '@/services/fundermaps'
import type {
  IRecoverySample,
  IRecoverySampleInput,
} from '@/services/fundermaps/interfaces/IRecoverySample'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'
import { getErrorMessage } from '@/services/fundermaps/errors'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const recoveryId = computed(() => Number(route.params.id))
const addressStore = useAddressStore()

const samples: Ref<IRecoverySample[]> = ref([])
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
    samples.value = await api.recoverySample.listAll(recoveryId.value)
    // Cache labels keyed by building id (PAND).
    await addressStore.ensureMany(samples.value.map((s) => s.building))
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

function cloneInputFrom(s: IRecoverySample, buildingId: string): IRecoverySampleInput {
  return {
    address: buildingId,
    note: s.note,
    status: s.status,
    type: s.type,
    pileType: s.pileType,
    facade: s.facade,
    permit: s.permit,
    permitDate: s.permitDate,
    recoveryDate: s.recoveryDate,
    contractor: s.contractor,
  }
}

async function handlePick(address: IAddress) {
  saving.value = true
  actionError.value = null
  // Cache the resolved address so the new sample renders with a label
  // immediately. Recovery samples key on building id, not gfm id.
  addressStore.cache[address.building_id] = address
  try {
    const payload = selected.value
      ? cloneInputFrom(selected.value, address.building_id)
      : emptyInput(address.building_id)
    const created = await api.recoverySample.create(recoveryId.value, payload)
    samples.value.unshift(created)
    selectedId.value = created.id
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    saving.value = false
  }
}

async function handleSave(data: IRecoverySampleInput) {
  if (!selected.value) return
  saving.value = true
  actionError.value = null
  try {
    await api.recoverySample.update(recoveryId.value, selected.value.id, data)
    const fresh = await api.recoverySample.getById(recoveryId.value, selected.value.id)
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
  const label = formatAddress(addressStore.cache[selected.value.building])
  if (!confirm(`Adres "${label}" verwijderen?`)) return
  saving.value = true
  actionError.value = null
  try {
    await api.recoverySample.remove(recoveryId.value, selected.value.id)
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
  router.push({ name: 'recovery-edit-3', params: { id: recoveryId.value } })
}

function previous() {
  router.push({ name: 'recovery-edit-1', params: { id: recoveryId.value } })
}
</script>

<template>
  <MainWrapper>
    <Card class="List col-span-3 mt-16">
      <header
        class="-mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
      >
        <h2 class="heading-3">Herstel — adressen (stap 2 van 3)</h2>
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
            {{ formatAddress(addressStore.cache[s.building]) }}
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
