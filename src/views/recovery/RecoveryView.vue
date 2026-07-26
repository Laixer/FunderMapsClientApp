<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import DocumentCard from '@/components/Common/DocumentCard.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import KeyValueList, { type KeyValueItem } from '@/components/Common/KeyValueList.vue'
import Panel from '@/components/Common/Panel.vue'
import PhaseCards from '@/components/Common/PhaseCards.vue'
import Pill from '@/components/Common/Pill.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import Timeline, { type TimelineEntry } from '@/components/Common/Timeline.vue'
import RejectModal from '@/components/Inquiry/RejectModal.vue'

import api from '@/services/fundermaps'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import type { IRecoverySample } from '@/services/fundermaps/interfaces/IRecoverySample'
import type { DocumentFileInfo } from '@/services/documentFile'
import { describeFailure } from '@/services/fundermaps/errors'
import {
  AUDIT_STATUS,
  FACADE_LABELS,
  recoveryDocumentTypeLabel,
  recoveryStatusLabel,
  recoveryTypeLabel,
} from '@/services/recoveryEnums'
import {
  eventMeta,
  nextStep,
  reopenedFrom,
  statusLabelFor,
  type DossierEvent,
} from '@/services/pipeline'
import { remember } from '@/services/recents'
import { confirmAction } from '@/services/confirm'
import { toastError, toastSuccess } from '@/services/toast'
import { formatAddress } from '@/utils/address'
import { formatDate, formatDateShort, formatDateTime } from '@/utils/date'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { useAddressStore } from '@/stores/address'
import { useSessionStore } from '@/stores/session'
import { useStudioStore } from '@/stores/studio'

/**
 * One herstel dossier, in the same shape as an inquiry's.
 *
 * The measure of completeness is different, though: a repair dossier's
 * substance is whether the work actually *happened*, so the progress bar counts
 * panden marked `uitgevoerd` rather than filled fields.
 */
const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const { canWrite, canApprove, isSuperUser } = storeToRefs(sessionStore)
const addressStore = useAddressStore()
const studio = useStudioStore()

const recoveryId = computed(() => Number(route.params.id))

const recovery: Ref<IRecovery | null> = ref(null)
const samples: Ref<IRecoverySample[]> = ref([])
const events: Ref<DossierEvent[]> = ref([])
const documentFile: Ref<DocumentFileInfo | null> = ref(null)
const documentLoading = ref(true)
const loading = ref(true)
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

/** `2` is the `executed` member of recovery_status. */
const EXECUTED = 2

const completeness = computed(() => {
  const total = samples.value.length
  const executed = samples.value.filter((s) => s.status === EXECUTED).length
  const dated = samples.value.filter((s) => s.recoveryDate).length
  const unknownType = samples.value.filter((s) => s.type === 5).length
  return { total, executed, dated, unknownType, ratio: total ? executed / total : 0 }
})

async function load() {
  try {
    loading.value = true
    const [r, s] = await Promise.all([
      api.recovery.getById(recoveryId.value),
      api.recoverySample.listAll(recoveryId.value),
    ])
    recovery.value = r
    samples.value = s
    remember('recovery', r.id, r.documentName)
    await addressStore.ensureMany(s.map((row) => row.building))
  } catch (e) {
    toastError(describeFailure(e, 'Dit dossier kon niet worden geladen.'))
  } finally {
    loading.value = false
  }

  // The trail is an enrichment, not the record. Fetched separately and
  // swallowed on failure so an API that predates the /events endpoint costs the
  // panel its timeline and nothing else.
  try {
    events.value = await api.recovery.getEvents(recoveryId.value)
  } catch {
    events.value = []
  }

  // Fetched on load rather than on click, because the card needs the signed
  // link to render a thumbnail. Non-fatal: a dossier is still readable without
  // its source file.
  try {
    documentFile.value = await api.recovery.getDownload(recoveryId.value)
  } catch {
    documentFile.value = null
  } finally {
    documentLoading.value = false
  }
}

onBeforeMount(load)
watch(recoveryId, load)

const step = computed(() => nextStep(status.value))

const blocker = computed<string | null>(() => {
  if (!canSubmitForReview.value) return null
  const { total, unknownType } = completeness.value
  if (total === 0) return 'Dit dossier heeft nog geen panden. Voeg er minstens één toe in stap 2.'
  if (unknownType > 0) {
    return unknownType === 1
      ? '1 pand heeft nog hersteltype “Onbekend”.'
      : `${unknownType} van de ${total} panden hebben nog hersteltype “Onbekend”.`
  }
  return null
})

const phaseProgress = computed<Array<number | null>>(() => [completeness.value.ratio, null, null])

const people = computed(() => ({
  creator: recovery.value?.attribution.creatorName ?? null,
  reviewer: recovery.value?.attribution.reviewerName ?? null,
}))

const metaLine = computed(() => {
  const row = recovery.value
  if (!row) return ''
  return [
    `#${row.id}`,
    recoveryDocumentTypeLabel(row.type),
    formatDate(row.documentDate),
    row.attribution.contractorName ?? 'onbekende uitvoerder',
  ].join(' · ')
})

const details = computed<KeyValueItem[]>(() => {
  const row = recovery.value
  if (!row) return []
  const items: KeyValueItem[] = [
    { label: 'Documenttype', value: recoveryDocumentTypeLabel(row.type) },
    { label: 'Uitvoerder', value: row.attribution.contractorName },
    { label: 'Data-eigenaar', value: row.attribution.dataOwnerName },
    { label: 'Documentdatum', value: formatDateShort(row.documentDate), mono: true },
    { label: 'Aangemaakt', value: formatDateShort(row.record.createDate), mono: true },
    {
      label: 'Uitgevoerd',
      value: `${completeness.value.executed} van ${completeness.value.total} panden`,
    },
  ]
  if (row.note) items.push({ label: 'Notitie', value: row.note })
  return items
})

const involved = computed(() => {
  const row = recovery.value
  if (!row) return []
  return [
    { name: row.attribution.creatorName, role: 'Opsteller · invoer' },
    { name: row.attribution.reviewerName, role: 'Beoordelaar · controle' },
  ].filter((person) => person.name)
})

function initials(name: string | null | undefined): string {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '??'
}

const trail = computed<TimelineEntry[]>(() =>
  events.value.map((event, i) => {
    const meta = eventMeta(event.kind)
    const from = reopenedFrom(event)
    return {
      id: `${event.kind}-${event.date}-${i}`,
      tone: meta.tone,
      who: event.actorName,
      what: from
        ? `${meta.label.toLowerCase()} uit “${statusLabelFor(from)}”`
        : meta.label.toLowerCase(),
      when: formatDateTime(event.date),
      note: event.note,
    }
  }),
)

function facades(sample: IRecoverySample): string {
  if (!sample.facade?.length) return '—'
  return sample.facade.map((value) => FACADE_LABELS[value] ?? String(value)).join(', ')
}

/* ----------------------------------------------------------------- actions */

function goEdit() {
  router.push({ name: 'recovery-edit-1', params: { id: recoveryId.value } })
}

function goInvoer() {
  router.push({ name: 'recovery-edit-2', params: { id: recoveryId.value } })
}

async function run(
  question: { title: string; body: string; confirmLabel: string; danger?: boolean },
  action: () => Promise<void>,
  success: string,
) {
  const ok = await confirmAction(question)
  if (!ok) return
  try {
    await action()
    toastSuccess(success)
    await load()
    studio.refreshCounts(sessionStore.currentUser?.id)
  } catch (e) {
    toastError(describeFailure(e, 'De actie is niet gelukt.'))
  }
}

function handleSubmitForReview() {
  return run(
    {
      title: 'Aanbieden ter review?',
      body: 'De beoordelaar krijgt bericht en het dossier wordt vergrendeld tot de controle klaar is.',
      confirmLabel: 'Aanbieden',
    },
    () => api.recovery.submitForReview(recoveryId.value),
    'Aangeboden ter review.',
  )
}

function handleApprove() {
  return run(
    {
      title: 'Herstel goedkeuren?',
      body: `${samples.value.length} pand(en) worden vastgesteld. Alleen een beheerder kan het dossier daarna nog heropenen.`,
      confirmLabel: 'Goedkeuren',
    },
    () => api.recovery.approve(recoveryId.value),
    'Goedgekeurd.',
  )
}

function handleReopen() {
  return run(
    {
      title: 'Heropenen',
      body: "Goedgekeurd herstel-dossier heropenen voor correcties? De status keert terug naar 'In behandeling'.",
      confirmLabel: 'Heropenen',
    },
    () => api.recovery.reset(recoveryId.value),
    'Heropend.',
  )
}

function handleDelete() {
  return run(
    {
      title: 'Herstel verwijderen?',
      body: `${samples.value.length} bijbehorend(e) pand(en) worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    },
    async () => {
      await api.recovery.remove(recoveryId.value)
      router.push({ name: 'recovery-list' })
    },
    'Herstel verwijderd.',
  )
}

async function handleReject(message: string) {
  try {
    await api.recovery.reject(recoveryId.value, message)
    showRejectModal.value = false
    toastSuccess('Afgekeurd en teruggestuurd naar de opsteller.')
    await load()
    studio.refreshCounts(sessionStore.currentUser?.id)
  } catch (e) {
    toastError(describeFailure(e, 'Afkeuren is niet gelukt.'))
  }
}

useActionShortcuts(() => {
  const actions: Record<string, () => void> = {}
  if (isEditable.value && canWrite.value) actions['⇧E'] = goEdit
  if (canSubmitForReview.value && canWrite.value) {
    actions['⇧S'] = () => void handleSubmitForReview()
  }
  if (isPendingReview.value && canApprove.value) {
    actions['⇧A'] = () => void handleApprove()
    actions['⇧R'] = () => (showRejectModal.value = true)
  }
  return actions
})
</script>

<template>
  <AppShell :crumb="recovery?.documentName ?? 'Herstel'">
    <div class="grid grid-cols-[minmax(0,1fr)_var(--spacing-aside)] items-start gap-4.5 px-6 py-6">
      <div class="flex min-w-0 flex-col gap-4">
        <header v-if="recovery" class="flex items-start gap-3.5">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-4xl font-display font-bold break-words text-ink">
                {{ recovery.documentName }}
              </h1>
              <StatusBadge :status="recovery.state.auditStatus" />
            </div>
            <p class="text-sm mt-1 font-mono text-faint">{{ metaLine }}</p>
          </div>

          <div class="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
            <Button v-if="isEditable && canWrite" label="Bewerken" shortcut="⇧E" @click="goEdit" />
            <Button
              v-if="canSubmitForReview && canWrite"
              variant="primary"
              label="Aanbieden ter review"
              shortcut="⇧S"
              @click="handleSubmitForReview"
            />
            <Button
              v-if="isPendingReview && canApprove"
              variant="primary"
              label="Goedkeuren"
              shortcut="⇧A"
              @click="handleApprove"
            />
            <Button
              v-if="isPendingReview && canApprove"
              variant="danger"
              label="Afkeuren"
              shortcut="⇧R"
              @click="showRejectModal = true"
            />
            <Button v-if="isReopenable && isSuperUser" label="Heropenen" @click="handleReopen" />
            <Button v-if="isSuperUser" variant="danger" label="Verwijderen" @click="handleDelete" />
          </div>
        </header>

        <Panel v-if="loading" caption="VOORTGANG">
          <EmptyState>Dossier ophalen…</EmptyState>
        </Panel>

        <template v-else-if="recovery">
          <Panel>
            <template #header>
              <span class="studio-caption">VOORTGANG</span>
              <span class="text-xs font-mono text-faint">
                {{ completeness.total }} {{ completeness.total === 1 ? 'pand' : 'panden' }}
                <template v-if="completeness.total">
                  · {{ completeness.executed }} uitgevoerd
                </template>
              </span>
            </template>

            <div class="flex flex-col gap-3.5">
              <PhaseCards
                :status="recovery.state.auditStatus"
                :people="people"
                :progress="phaseProgress"
              />

              <Callout :tone="step.tone" :title="step.title">
                {{ blocker ?? step.detail }}
                <template v-if="isEditable && canWrite" #action>
                  <Button label="Naar invoer" @click="goInvoer" />
                </template>
              </Callout>
            </div>
          </Panel>

          <div class="grid grid-cols-2 items-start gap-4">
            <Panel caption="DETAILS">
              <KeyValueList :items="details" />
            </Panel>
            <DocumentCard :file="documentFile" :loading="documentLoading" />
          </div>

          <Panel flush>
            <template #header>
              <span class="text-lg font-bold text-strong">Panden</span>
              <span class="text-xs font-mono text-faint">{{ samples.length }}</span>
            </template>

            <ul v-if="samples.length">
              <li
                v-for="sample in samples"
                :key="sample.id"
                class="flex flex-col gap-1.5 border-b border-divider px-4 py-3 last:border-b-0"
              >
                <div class="flex items-center gap-2.5">
                  <span class="text-lg min-w-0 flex-1 truncate font-semibold text-body">
                    {{ formatAddress(addressStore.cache[sample.building]) }}
                  </span>
                  <Pill
                    :label="recoveryTypeLabel(sample.type)"
                    :tone="sample.type === 5 ? 'amber' : 'green'"
                  />
                  <Pill
                    :label="recoveryStatusLabel(sample.status)"
                    :tone="sample.status === EXECUTED ? 'green' : 'neutral'"
                  />
                </div>
                <p class="text-sm font-mono text-faint">
                  gevels: {{ facades(sample) }}
                  <template v-if="sample.permit"> · vergunning {{ sample.permit }}</template>
                  <template v-if="sample.recoveryDate">
                    · uitgevoerd {{ formatDateShort(sample.recoveryDate) }}
                  </template>
                </p>
                <p v-if="sample.note" class="text-md text-muted">{{ sample.note }}</p>
              </li>
            </ul>
            <EmptyState v-else>Nog geen panden toegevoegd.</EmptyState>
          </Panel>
        </template>
      </div>

      <aside class="sticky top-[calc(var(--spacing-topbar)+1.5rem)] flex flex-col gap-4">
        <Panel caption="BETROKKEN">
          <ul v-if="involved.length" class="flex flex-col gap-2.5">
            <li v-for="person in involved" :key="person.role" class="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                class="text-xs inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas font-bold text-muted"
              >
                {{ initials(person.name) }}
              </span>
              <span class="min-w-0">
                <span class="text-md block truncate font-semibold text-strong">
                  {{ person.name }}
                </span>
                <span class="text-sm block text-faint">{{ person.role }}</span>
              </span>
            </li>
          </ul>
          <EmptyState v-else>Niemand toegewezen.</EmptyState>
        </Panel>

        <Panel caption="HISTORIE">
          <Timeline v-if="trail.length" :entries="trail" />
          <EmptyState v-else>Geen geschiedenis vastgelegd voor dit dossier.</EmptyState>
        </Panel>
      </aside>
    </div>

    <RejectModal v-if="showRejectModal" @close="showRejectModal = false" @submit="handleReject" />
  </AppShell>
</template>
