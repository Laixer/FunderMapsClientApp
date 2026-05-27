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
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import type { IRecoverySample } from '@/services/fundermaps/interfaces/IRecoverySample'
import {
  AUDIT_STATUS,
  recoveryDocumentTypeLabel,
  recoveryTypeLabel,
  recoveryStatusLabel,
} from '@/services/recoveryEnums'
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

const recoveryId = computed(() => Number(route.params.id))

const recovery: Ref<IRecovery | null> = ref(null)
const samples: Ref<IRecoverySample[]> = ref([])
const loading = ref(true)
const error: Ref<string | null> = ref(null)
const actionError: Ref<string | null> = ref(null)
const showRejectModal = ref(false)

const status = computed(() => recovery.value?.state?.auditStatus ?? null)
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

async function load() {
  try {
    loading.value = true
    error.value = null
    const [r, s] = await Promise.all([
      api.recovery.getById(recoveryId.value),
      api.recoverySample.listAll(recoveryId.value),
    ])
    recovery.value = r
    samples.value = s
    await addressStore.ensureMany(s.map((row) => row.building))
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

function goEdit() {
  router.push({ name: 'recovery-edit-1', params: { id: recoveryId.value } })
}

async function handleSubmitForReview() {
  if (!confirm('Aanbieden ter review?')) return
  try {
    actionError.value = null
    await api.recovery.submitForReview(recoveryId.value)
    await load()
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}

async function handleApprove() {
  if (!confirm('Herstel goedkeuren?')) return
  try {
    actionError.value = null
    await api.recovery.approve(recoveryId.value)
    await load()
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}

async function handleReject(message: string) {
  try {
    actionError.value = null
    await api.recovery.reject(recoveryId.value, message)
    showRejectModal.value = false
    await load()
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}

async function handleDownload() {
  try {
    const { accessLink } = await api.recovery.getDownload(recoveryId.value)
    window.open(accessLink, '_blank', 'noopener')
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}

async function handleDelete() {
  if (
    !confirm(
      'Weet je zeker dat je dit herstel wilt verwijderen? Alle bijbehorende adressen worden ook verwijderd. Deze actie kan niet ongedaan worden gemaakt.',
    )
  )
    return
  try {
    actionError.value = null
    await api.recovery.remove(recoveryId.value)
    router.push({ name: 'recovery-list' })
  } catch (e) {
    actionError.value = getErrorMessage(e) ?? t('error.generic')
  }
}
</script>

<template>
  <MainWrapper>
    <div class="mb-8 space-y-3">
      <RouterLink
        :to="{ name: 'recovery-list' }"
        class="inline-flex items-center gap-1 text-xs font-medium text-grey-700 hover:text-grey-800"
      >
        ← {{ t('recovery.view.back') }}
      </RouterLink>

      <template v-if="recovery">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-2xl font-semibold text-grey-800">{{ recovery.documentName }}</h2>
              <StatusBadge :status="recovery.state.auditStatus" />
            </div>
            <p class="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-grey-700">
              <span>{{ recoveryDocumentTypeLabel(recovery.type) }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ formatDate(recovery.documentDate) }}</span>
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

    <Card v-else-if="recovery">
      <div class="space-y-6">
        <section>
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-700">
            Details
          </h4>
          <dl class="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt class="text-grey-700">Opsteller</dt>
            <dd class="text-grey-800">{{ recovery.attribution.creatorName ?? '—' }}</dd>

            <dt class="text-grey-700">Beoordelaar</dt>
            <dd class="text-grey-800">{{ recovery.attribution.reviewerName ?? '—' }}</dd>

            <dt class="text-grey-700">Uitvoerder</dt>
            <dd class="text-grey-800">{{ recovery.attribution.contractorName ?? '—' }}</dd>

            <template v-if="recovery.note">
              <dt class="text-grey-700">Notitie</dt>
              <dd class="whitespace-pre-wrap text-grey-800">{{ recovery.note }}</dd>
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
                {{ formatAddress(addressStore.cache[s.building]) }}
              </p>
              <p class="text-xs text-grey-700">
                {{ recoveryTypeLabel(s.type) }}
                <template v-if="s.status !== null">
                  · {{ recoveryStatusLabel(s.status) }}
                </template>
                <template v-if="s.recoveryDate">· {{ formatDate(s.recoveryDate) }}</template>
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
