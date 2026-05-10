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
      api.recoverySample.list(recoveryId.value, { limit: 200 }),
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
    <Card class="List col-span-3 mt-16">
      <RouterLink :to="{ name: 'recovery-list' }" class="text-sm text-green-700 hover:underline">
        ← {{ t('recovery.view.back') }}
      </RouterLink>

      <Spinner v-if="loading" />
      <span v-if="false">{{ t('common.loading') }}</span>
      <Alert v-if="error" :closeable="true" @close="error = null">{{ error }}</Alert>

      <template v-if="recovery">
        <header
          class="-mx-5 flex flex-wrap items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
        >
          <div class="space-y-1">
            <h2 class="heading-3">{{ recovery.documentName }}</h2>
            <div class="flex items-center gap-2 text-sm text-grey-700">
              <span>{{ recoveryDocumentTypeLabel(recovery.type) }}</span>
              <span>·</span>
              <span>{{ formatDate(recovery.documentDate) }}</span>
              <StatusBadge :status="recovery.state.auditStatus" />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button label="Document" outline @click="handleDownload" />
            <Button v-if="isEditable && canWrite" label="Bewerken" outline @click="goEdit" />
            <Button
              v-if="canSubmitForReview && canWrite"
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
            <Button
              v-if="isSuperUser"
              label="Verwijderen"
              danger
              @click="handleDelete"
            />
          </div>
        </header>

        <Alert v-if="actionError" :closeable="true" @close="actionError = null">
          {{ actionError }}
        </Alert>

        <div class="space-y-8">
          <section>
            <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
              Details
            </h4>
            <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <dt class="font-medium text-grey-700">Opsteller</dt>
              <dd class="sm:col-span-2">{{ recovery.attribution.creatorName ?? '-' }}</dd>

              <dt class="font-medium text-grey-700">Beoordelaar</dt>
              <dd class="sm:col-span-2">{{ recovery.attribution.reviewerName ?? '-' }}</dd>

              <dt class="font-medium text-grey-700">Uitvoerder</dt>
              <dd class="sm:col-span-2">{{ recovery.attribution.contractorName ?? '-' }}</dd>

              <dt v-if="recovery.note" class="font-medium text-grey-700">Notitie</dt>
              <dd v-if="recovery.note" class="whitespace-pre-wrap sm:col-span-2">
                {{ recovery.note }}
              </dd>
            </dl>
          </section>

          <section>
            <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
              Adressen ({{ samples.length }})
            </h4>
            <p v-if="samples.length === 0" class="text-sm text-grey-700">
              Nog geen adressen toegevoegd.
            </p>
            <ul v-else class="divide-y divide-grey-200">
              <li v-for="s in samples" :key="s.id" class="space-y-1 py-3 text-sm">
                <p class="font-semibold text-grey-800">
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
      </template>
    </Card>

    <RejectModal v-if="showRejectModal" @close="showRejectModal = false" @submit="handleReject" />
  </MainWrapper>
</template>
