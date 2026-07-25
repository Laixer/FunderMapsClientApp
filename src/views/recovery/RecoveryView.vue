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
import DossierProgress from '@/components/Common/DossierProgress.vue'
import type { DossierEvent } from '@/services/pipeline'

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
const events: Ref<DossierEvent[]> = ref([])
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
// Escape hatch for "approved but an error surfaced later" — restricted to org
// admins (issue #250). The API's /reset is an unconditional → pending move.
const isReopenable = computed(() => status.value === AUDIT_STATUS.DONE)

/**
 * A recovery dossier's substance is whether the work actually happened, so
 * count that rather than filled fields (`RECOVERY_STATUS_LABELS[2]` = uitgevoerd).
 */
const RECOVERY_STATUS_EXECUTED = 2

const completeness = computed(() => {
  const total = samples.value.length
  const executed = samples.value.filter((s) => s.status === RECOVERY_STATUS_EXECUTED).length
  const dated = samples.value.filter((s) => s.recoveryDate).length
  return { total, executed, dated }
})

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

  // The trail is an enrichment, not the record. Fetched separately and
  // swallowed on failure so an API that predates the /events endpoint costs
  // the panel its timeline and nothing else.
  try {
    events.value = await api.recovery.getEvents(recoveryId.value)
  } catch {
    events.value = []
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

async function handleReopen() {
  if (!confirm(t('recovery.view.reopenConfirm'))) return
  try {
    actionError.value = null
    await api.recovery.reset(recoveryId.value)
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
        class="text-grey-700 hover:text-grey-800 inline-flex items-center gap-1 text-xs font-medium"
      >
        ← {{ t('recovery.view.back') }}
      </RouterLink>

      <template v-if="recovery">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-grey-800 text-2xl font-semibold">{{ recovery.documentName }}</h2>
              <StatusBadge :status="recovery.state.auditStatus" :events="events" />
            </div>
            <p class="text-grey-700 mt-0.5 flex flex-wrap items-center gap-2 text-sm">
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
            <Button
              v-if="isReopenable && isSuperUser"
              outline
              :label="t('recovery.view.reopen')"
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

    <template v-else-if="recovery">
      <DossierProgress
        class="mb-4"
        :status="recovery.state.auditStatus"
        :create-date="recovery.record.createDate"
        :document-date="recovery.documentDate"
        :creator-name="recovery.attribution.creatorName"
        :reviewer-name="recovery.attribution.reviewerName"
      >
        <template #facts>
          <dt class="text-grey-700">Adressen</dt>
          <dd class="text-grey-800">
            <template v-if="completeness.total === 0">nog geen</template>
            <template v-else>
              {{ completeness.total }}
              <span class="text-grey-700">
                · {{ completeness.executed }} uitgevoerd · {{ completeness.dated }} met datum
              </span>
            </template>
          </dd>
        </template>
      </DossierProgress>

      <Card>
        <div class="space-y-6">
          <section>
            <h4 class="text-grey-700 mb-3 text-xs font-semibold tracking-wide uppercase">
              Details
            </h4>
            <dl class="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
              <dt class="text-grey-700">Uitvoerder</dt>
              <dd class="text-grey-800">{{ recovery.attribution.contractorName ?? '—' }}</dd>

              <template v-if="recovery.note">
                <dt class="text-grey-700">Notitie</dt>
                <dd class="text-grey-800 whitespace-pre-wrap">{{ recovery.note }}</dd>
              </template>
            </dl>
          </section>

          <section>
            <h4 class="text-grey-700 mb-3 text-xs font-semibold tracking-wide uppercase">
              Adressen ({{ samples.length }})
            </h4>
            <p v-if="samples.length === 0" class="text-grey-700 text-sm">
              Nog geen adressen toegevoegd.
            </p>
            <ul v-else class="border-grey-200 overflow-hidden rounded-md border">
              <li
                v-for="s in samples"
                :key="s.id"
                class="border-grey-200 space-y-1 border-b px-3 py-3 text-sm last:border-b-0"
              >
                <p class="text-grey-800 font-medium">
                  {{ formatAddress(addressStore.cache[s.building]) }}
                </p>
                <p class="text-grey-700 text-xs">
                  {{ recoveryTypeLabel(s.type) }}
                  <template v-if="s.status !== null">
                    · {{ recoveryStatusLabel(s.status) }}
                  </template>
                  <template v-if="s.recoveryDate">· {{ formatDate(s.recoveryDate) }}</template>
                </p>
                <p v-if="s.note" class="text-grey-700 text-xs">{{ s.note }}</p>
              </li>
            </ul>
          </section>
        </div>
      </Card>
    </template>

    <RejectModal v-if="showRejectModal" @close="showRejectModal = false" @submit="handleReject" />
  </MainWrapper>
</template>
