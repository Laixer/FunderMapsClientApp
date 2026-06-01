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
const { canWrite, canApprove, isSuperUser } = storeToRefs(sessionStore)
const addressStore = useAddressStore()

const inquiryId = computed(() => Number(route.params.id))

const inquiry: Ref<IInquiry | null> = ref(null)
const samples: Ref<IInquirySample[]> = ref([])
const loading = ref(true)
const error: Ref<string | null> = ref(null)
const actionError: Ref<string | null> = ref(null)
const showRejectModal = ref(false)

const status = computed(() => inquiry.value?.state?.auditStatus ?? null)
// Editable until the inquiry is approved (DONE). Discarded inquiries are
// also frozen — they're a deliberate close-out, not active work.
const isEditable = computed(
  () =>
    status.value !== null &&
    status.value !== AUDIT_STATUS.DONE &&
    status.value !== AUDIT_STATUS.DISCARDED,
)
const canSubmitForReview = computed(
  () =>
    status.value === AUDIT_STATUS.TODO ||
    status.value === AUDIT_STATUS.PENDING ||
    status.value === AUDIT_STATUS.REJECTED,
)
const isPendingReview = computed(() => status.value === AUDIT_STATUS.PENDING_REVIEW)
// Escape hatch for "approved but an error surfaced later" — restricted to org
// admins (issue #250). The API's /reset is an unconditional → pending move.
const isReopenable = computed(() => status.value === AUDIT_STATUS.DONE)

async function load() {
  try {
    loading.value = true
    error.value = null
    const [i, s] = await Promise.all([
      api.inquiry.getById(inquiryId.value),
      api.inquirySample.listAll(inquiryId.value),
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

async function handleReopen() {
  if (!confirm(t('inquiry.view.reopenConfirm'))) return
  try {
    actionError.value = null
    await api.inquiry.reset(inquiryId.value)
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

async function handleDelete() {
  if (
    !confirm(
      'Weet je zeker dat je dit rapport wilt verwijderen? Alle bijbehorende adressen worden ook verwijderd. Deze actie kan niet ongedaan worden gemaakt.',
    )
  )
    return
  try {
    actionError.value = null
    await api.inquiry.remove(inquiryId.value)
    router.push({ name: 'inquiry-list' })
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
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

      <template v-if="inquiry">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-2xl font-semibold text-grey-800">{{ inquiry.documentName }}</h2>
              <StatusBadge :status="inquiry.state.auditStatus" />
            </div>
            <p class="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-grey-700">
              <span>{{ inquiryTypeLabel(inquiry.type) }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ formatDate(inquiry.documentDate) }}</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button outline label="Document" @click="handleDownload" />
            <Button v-if="isEditable && canWrite" outline label="Bewerken" @click="goEdit" />
            <Button
              v-if="canSubmitForReview && canWrite"
              lg
              label="Aanbieden ter review"
              @click="handleSubmitForReview"
            />
            <Button
              v-if="isPendingReview && canApprove"
              lg
              label="Goedkeuren"
              @click="handleApprove"
            />
            <Button
              v-if="isPendingReview && canApprove"
              danger
              label="Afkeuren"
              @click="showRejectModal = true"
            />
            <Button
              v-if="isReopenable && isSuperUser"
              outline
              :label="t('inquiry.view.reopen')"
              @click="handleReopen"
            />
            <Button v-if="isSuperUser" danger label="Verwijderen" @click="handleDelete" />
          </div>
        </div>
      </template>
    </div>

    <Alert v-if="error" :closeable="true" class="mb-3" @close="error = null">{{ error }}</Alert>
    <Alert v-if="actionError" :closeable="true" class="mb-3" @close="actionError = null">
      {{ actionError }}
    </Alert>

    <Card v-if="loading" class="flex justify-center py-8">
      <Spinner />
      <span v-if="false">{{ t('common.loading') }}</span>
    </Card>

    <Card v-else-if="inquiry">
      <div class="space-y-6">
        <section>
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-700">
            Details
          </h4>
          <dl class="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt class="text-grey-700">Opsteller</dt>
            <dd class="text-grey-800">{{ inquiry.attribution.creatorName ?? '—' }}</dd>

            <dt class="text-grey-700">Beoordelaar</dt>
            <dd class="text-grey-800">{{ inquiry.attribution.reviewerName ?? '—' }}</dd>

            <dt class="text-grey-700">Uitvoerder</dt>
            <dd class="text-grey-800">{{ inquiry.attribution.contractorName ?? '—' }}</dd>

            <dt class="text-grey-700">Inspectie</dt>
            <dd class="text-grey-800">{{ inquiry.inspection ? 'Ja' : 'Nee' }}</dd>

            <dt class="text-grey-700">Voegmeting</dt>
            <dd class="text-grey-800">{{ inquiry.jointMeasurement ? 'Ja' : 'Nee' }}</dd>

            <dt class="text-grey-700">Vloermeting</dt>
            <dd class="text-grey-800">{{ inquiry.floorMeasurement ? 'Ja' : 'Nee' }}</dd>

            <dt class="text-grey-700">F3O standaard</dt>
            <dd class="text-grey-800">{{ inquiry.standardF3o ? 'Ja' : 'Nee' }}</dd>

            <template v-if="inquiry.note">
              <dt class="text-grey-700">Notitie</dt>
              <dd class="whitespace-pre-wrap text-grey-800">{{ inquiry.note }}</dd>
            </template>
          </dl>
        </section>

        <section>
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-700">
            Adressen ({{ samples.length }})
          </h4>
          <p v-if="samples.length === 0" class="text-sm text-grey-700">
            Nog geen adressen toegevoegd.
          </p>
          <ul v-else class="overflow-hidden rounded-md border border-grey-200">
            <li
              v-for="s in samples"
              :key="s.id"
              class="space-y-1 border-b border-grey-200 px-3 py-3 text-sm last:border-b-0"
            >
              <p class="font-medium text-grey-800">
                {{ formatAddress(addressStore.cache[s.address]) }}
              </p>
              <p v-if="s.note" class="text-xs text-grey-700">{{ s.note }}</p>
            </li>
          </ul>
        </section>
      </div>
    </Card>

    <RejectModal v-if="showRejectModal" @close="showRejectModal = false" @submit="handleReject" />
  </MainWrapper>
</template>
