<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Card from '@/components/Common/Card.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import Spinner from '@/components/Common/Spinner.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import { AUDIT_STATUS, inquiryTypeLabel } from '@/services/inquiryEnums'
import { formatDate } from '@/utils/date'
import { formatAddress } from '@/utils/address'
import { getErrorMessage } from '@/services/fundermaps/errors'
import { useAddressStore } from '@/stores/address'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const inquiryId = computed(() => Number(route.params.id))
const addressStore = useAddressStore()

const inquiry: Ref<IInquiry | null> = ref(null)
const samples: Ref<IInquirySample[]> = ref([])
const loading = ref(true)
const submitting = ref(false)
const error: Ref<string | null> = ref(null)

const canSubmit = computed(() => {
  if (!inquiry.value) return false
  const s = inquiry.value.state.auditStatus
  return (
    samples.value.length > 0 &&
    (s === AUDIT_STATUS.TODO || s === AUDIT_STATUS.PENDING || s === AUDIT_STATUS.REJECTED)
  )
})

async function load() {
  try {
    loading.value = true
    error.value = null
    const [i, s] = await Promise.all([
      api.inquiry.getById(inquiryId.value),
      api.inquirySample.list(inquiryId.value, { limit: 200 }),
    ])
    inquiry.value = i
    samples.value = s
    await addressStore.ensureMany(s.map((row) => row.address))
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

async function submit() {
  if (!canSubmit.value || submitting.value) return
  if (!confirm('Aanbieden ter review?')) return
  submitting.value = true
  error.value = null
  try {
    await api.inquiry.submitForReview(inquiryId.value)
    router.push({ name: 'inquiry-view', params: { id: inquiryId.value } })
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    submitting.value = false
  }
}

function previous() {
  router.push({ name: 'inquiry-edit-2', params: { id: inquiryId.value } })
}
</script>

<template>
  <MainWrapper>
    <main class="col-span-3 mt-16 space-y-6 p-8">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl text-blue-900">Rapportage — controle (stap 3 van 3)</h1>
        <div class="flex gap-2">
          <Button label="Vorige" outline @click="previous" />
          <Button label="Aanbieden ter review" :disabled="!canSubmit || submitting" @click="submit" />
        </div>
      </header>

      <Alert v-if="error" :closeable="true" @close="error = null">{{ error }}</Alert>

      <Spinner v-if="loading" />
      <span v-if="false">{{ t('common.loading') }}</span>

      <template v-if="inquiry">
        <div class="flex items-center gap-2 text-sm text-grey-700">
          <span>{{ inquiryTypeLabel(inquiry.type) }}</span>
          <span>·</span>
          <span>{{ formatDate(inquiry.documentDate) }}</span>
          <StatusBadge :status="inquiry.state.auditStatus" />
        </div>

        <Card title="Rapport">
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <dt class="font-medium text-grey-700">Naam</dt>
            <dd class="sm:col-span-2">{{ inquiry.documentName }}</dd>

            <dt class="font-medium text-grey-700">Opsteller</dt>
            <dd class="sm:col-span-2">{{ inquiry.attribution.creatorName ?? '-' }}</dd>

            <dt class="font-medium text-grey-700">Beoordelaar</dt>
            <dd class="sm:col-span-2">{{ inquiry.attribution.reviewerName ?? '-' }}</dd>

            <dt class="font-medium text-grey-700">Uitvoerder</dt>
            <dd class="sm:col-span-2">{{ inquiry.attribution.contractorName ?? '-' }}</dd>

            <dt v-if="inquiry.note" class="font-medium text-grey-700">Notitie</dt>
            <dd v-if="inquiry.note" class="whitespace-pre-wrap sm:col-span-2">
              {{ inquiry.note }}
            </dd>
          </dl>
        </Card>

        <Card :title="`Adressen (${samples.length})`">
          <p v-if="samples.length === 0" class="text-sm text-red-500">
            Voeg minimaal één adres toe in stap 2 voordat je het rapport indient.
          </p>
          <ul v-else class="divide-y divide-grey-200">
            <li v-for="s in samples" :key="s.id" class="py-3 text-sm">
              <p class="font-semibold text-grey-800">
                {{ formatAddress(addressStore.cache[s.address]) }}
              </p>
              <p v-if="s.note" class="text-xs text-grey-700">{{ s.note }}</p>
            </li>
          </ul>
        </Card>

        <p v-if="!canSubmit && samples.length > 0" class="text-sm text-grey-700">
          Dit rapport heeft status "{{ inquiry.state.auditStatus }}" en kan niet meer worden ingediend.
        </p>
      </template>
    </main>
  </MainWrapper>
</template>
