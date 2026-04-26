<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Card from '@/components/Common/Card.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import Spinner from '@/components/Common/Spinner.vue'
import RejectModal from '@/components/Inquiry/RejectModal.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import { AUDIT_STATUS, inquiryTypeLabel } from '@/services/inquiryEnums'
import { formatDate } from '@/utils/date'
import { formatAddress } from '@/utils/address'
import { getErrorMessage } from '@/services/fundermaps/errors'
import { useSessionStore } from '@/stores/session'
import { useAddressStore } from '@/stores/address'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const { canWrite, canApprove } = storeToRefs(sessionStore)
const addressStore = useAddressStore()

const inquiryId = computed(() => Number(route.params.id))

const inquiry: Ref<IInquiry | null> = ref(null)
const samples: Ref<IInquirySample[]> = ref([])
const loading = ref(true)
const error: Ref<string | null> = ref(null)
const actionError: Ref<string | null> = ref(null)
const showRejectModal = ref(false)

const status = computed(() => inquiry.value?.state?.auditStatus ?? null)
const isEditable = computed(
  () =>
    status.value === AUDIT_STATUS.TODO ||
    status.value === AUDIT_STATUS.PENDING ||
    status.value === AUDIT_STATUS.REJECTED,
)
const isPendingReview = computed(() => status.value === AUDIT_STATUS.PENDING_REVIEW)

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

function goEdit() {
  router.push({ name: 'inquiry-edit-1', params: { id: inquiryId.value } })
}

async function handleSubmitForReview() {
  if (!confirm('Aanbieden ter review?')) return
  try {
    actionError.value = null
    await api.inquiry.submitForReview(inquiryId.value)
    await load()
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}

async function handleApprove() {
  if (!confirm('Rapport goedkeuren?')) return
  try {
    actionError.value = null
    await api.inquiry.approve(inquiryId.value)
    await load()
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}

async function handleReject(message: string) {
  try {
    actionError.value = null
    await api.inquiry.reject(inquiryId.value, message)
    showRejectModal.value = false
    await load()
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}

async function handleDownload() {
  try {
    const { accessLink } = await api.inquiry.getDownload(inquiryId.value)
    window.open(accessLink, '_blank', 'noopener')
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}
</script>

<template>
  <MainWrapper>
    <Card v-if="loading || error || !inquiry" class="List col-span-3 mt-16">
      <RouterLink :to="{ name: 'inquiry-list' }" class="text-sm text-green-700 hover:underline">
        ← {{ t('inquiry.view.back') }}
      </RouterLink>
      <Spinner v-if="loading" />
      <span v-if="false">{{ t('common.loading') }}</span>
      <Alert v-if="error" :closeable="true" @close="error = null">{{ error }}</Alert>
    </Card>

    <template v-if="inquiry">
      <Card class="List col-span-3 mt-16">
        <RouterLink :to="{ name: 'inquiry-list' }" class="text-sm text-green-700 hover:underline">
          ← {{ t('inquiry.view.back') }}
        </RouterLink>
        <header
          class="-mx-5 flex flex-wrap items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
        >
          <div class="space-y-1">
            <h2 class="heading-3">{{ inquiry.documentName }}</h2>
            <div class="flex items-center gap-2 text-sm text-grey-700">
              <span>{{ inquiryTypeLabel(inquiry.type) }}</span>
              <span>·</span>
              <span>{{ formatDate(inquiry.documentDate) }}</span>
              <StatusBadge :status="inquiry.state.auditStatus" />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button label="Document" outline @click="handleDownload" />
            <Button v-if="isEditable && canWrite" label="Bewerken" outline @click="goEdit" />
            <Button
              v-if="isEditable && canWrite"
              label="Aanbieden ter review"
              @click="handleSubmitForReview"
            />
            <Button
              v-if="isPendingReview && canApprove"
              label="Goedkeuren"
              @click="handleApprove"
            />
            <Button
              v-if="isPendingReview && canApprove"
              label="Afkeuren"
              danger
              @click="showRejectModal = true"
            />
          </div>
        </header>

        <Alert v-if="actionError" :closeable="true" @close="actionError = null">
          {{ actionError }}
        </Alert>
      </Card>

      <Card class="List col-span-3" title="Details">
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <dt class="font-medium text-grey-700">Opsteller</dt>
            <dd class="sm:col-span-2">{{ inquiry.attribution.creatorName ?? '-' }}</dd>

            <dt class="font-medium text-grey-700">Beoordelaar</dt>
            <dd class="sm:col-span-2">{{ inquiry.attribution.reviewerName ?? '-' }}</dd>

            <dt class="font-medium text-grey-700">Uitvoerder</dt>
            <dd class="sm:col-span-2">{{ inquiry.attribution.contractorName ?? '-' }}</dd>

            <dt class="font-medium text-grey-700">Inspectie</dt>
            <dd class="sm:col-span-2">{{ inquiry.inspection ? 'Ja' : 'Nee' }}</dd>

            <dt class="font-medium text-grey-700">Voegmeting</dt>
            <dd class="sm:col-span-2">{{ inquiry.jointMeasurement ? 'Ja' : 'Nee' }}</dd>

            <dt class="font-medium text-grey-700">Vloermeting</dt>
            <dd class="sm:col-span-2">{{ inquiry.floorMeasurement ? 'Ja' : 'Nee' }}</dd>

            <dt class="font-medium text-grey-700">F3O standaard</dt>
            <dd class="sm:col-span-2">{{ inquiry.standardF3o ? 'Ja' : 'Nee' }}</dd>

            <dt v-if="inquiry.note" class="font-medium text-grey-700">Notitie</dt>
            <dd v-if="inquiry.note" class="whitespace-pre-wrap sm:col-span-2">
              {{ inquiry.note }}
            </dd>
          </dl>
        </Card>

      <Card class="List col-span-3" :title="`Adressen (${samples.length})`">
          <p v-if="samples.length === 0" class="text-sm text-grey-700">
            Nog geen adressen toegevoegd.
          </p>
          <ul v-else class="divide-y divide-grey-200">
            <li
              v-for="s in samples"
              :key="s.id"
              class="space-y-1 py-3 text-sm"
            >
              <p class="font-semibold text-grey-800">
                {{ formatAddress(addressStore.cache[s.address]) }}
              </p>
              <p v-if="s.note" class="text-xs text-grey-700">{{ s.note }}</p>
            </li>
          </ul>
        </Card>
      </template>

    <RejectModal v-if="showRejectModal" @close="showRejectModal = false" @submit="handleReject" />
  </MainWrapper>
</template>
