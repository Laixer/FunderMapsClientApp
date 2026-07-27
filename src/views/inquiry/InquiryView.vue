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
import ProgressBar from '@/components/Common/ProgressBar.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import Timeline, { type TimelineEntry } from '@/components/Common/Timeline.vue'
import RejectModal from '@/components/Inquiry/RejectModal.vue'
import SampleOverview from '@/components/Inquiry/SampleOverview.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import type { DocumentFileInfo } from '@/services/documentFile'
import { describeFailure } from '@/services/fundermaps/errors'
import { AUDIT_STATUS, inquiryTypeLabel } from '@/services/inquiryEnums'
import {
  eventMeta,
  nextStep,
  reopenedFrom,
  statusLabelFor,
  type DossierEvent,
} from '@/services/pipeline'
import { remember } from '@/services/recents'
import { countFilledSampleFields, sampleCompleteness } from '@/services/sampleFields'
import { findingsFor } from '@/services/sampleValidation'
import { toastError, toastSuccess } from '@/services/toast'
import { confirmAction } from '@/services/confirm'
import { formatAddress } from '@/utils/address'
import { formatDate, formatDateShort, formatDateTime } from '@/utils/date'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { useAddressStore } from '@/stores/address'
import { useSessionStore } from '@/stores/session'
import { useStudioStore } from '@/stores/studio'

/**
 * One dossier, as a workspace.
 *
 * The order of the page is the order of the questions people actually ask:
 * where does this stand, what is blocking it, what is in it, which addresses.
 * The document's own metadata comes third, because it does not change and
 * nobody is waiting on it.
 *
 * The next-action callout names the *specific* blocker where it can — "1 van 2
 * adressen mist een funderingstype" rather than "invoer nog niet compleet" —
 * because the specific version can be acted on without opening anything.
 */
const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const { canWrite, canApprove, isSuperUser } = storeToRefs(sessionStore)
const addressStore = useAddressStore()
const studio = useStudioStore()

const inquiryId = computed(() => Number(route.params.id))

const inquiry: Ref<IInquiry | null> = ref(null)
const samples: Ref<IInquirySample[]> = ref([])
const events: Ref<DossierEvent[]> = ref([])
const documentFile: Ref<DocumentFileInfo | null> = ref(null)
const documentLoading = ref(true)
const loading = ref(true)
const showRejectModal = ref(false)

const status = computed(() => inquiry.value?.state?.auditStatus ?? null)

// Editable until the inquiry is approved (DONE). Discarded inquiries are also
// frozen — they are a deliberate close-out, not active work.
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
    const [i, s] = await Promise.all([
      api.inquiry.getById(inquiryId.value),
      api.inquirySample.listAll(inquiryId.value),
    ])
    inquiry.value = i
    samples.value = s
    remember('inquiry', i.id, i.documentName)
    await addressStore.ensureMany(s.map((row) => row.address))
  } catch (e) {
    toastError(describeFailure(e, 'Dit dossier kon niet worden geladen.'))
  } finally {
    loading.value = false
  }

  // The trail is an enrichment, not the record. Fetched separately and
  // swallowed on failure so an API that predates the /events endpoint costs the
  // panel its timeline and nothing else.
  try {
    events.value = await api.inquiry.getEvents(inquiryId.value)
  } catch {
    events.value = []
  }

  // Fetched on load rather than on click, because the card needs the signed
  // link to render a thumbnail. Non-fatal: a dossier is still readable without
  // its source file.
  try {
    documentFile.value = await api.inquiry.getDownload(inquiryId.value)
  } catch {
    documentFile.value = null
  } finally {
    documentLoading.value = false
  }
}

onBeforeMount(load)
watch(inquiryId, load)

/* ------------------------------------------------------------ completeness */

/**
 * How far the entry actually got, counted rather than asserted. A reviewer's
 * first question is "is this finished?", and 14 addresses of which 3 are empty
 * shells answers it faster than opening 14 panels.
 */
const completeness = computed(() => {
  const total = samples.value.length
  const withFoundationType = samples.value.filter((s) => s.foundationType !== null).length
  const empty = samples.value.filter((s) => countFilledSampleFields(s) === 0).length
  const filled = samples.value.reduce((sum, s) => sum + sampleCompleteness(s), 0)
  return { total, withFoundationType, empty, ratio: total ? filled / total : 0 }
})

const step = computed(() => nextStep(status.value))

/**
 * The blocker, named. Only ever a fact we counted — if nothing specific is in
 * the way, the generic sentence from the pipeline model is the honest answer.
 */
const blocker = computed<string | null>(() => {
  if (!canSubmitForReview.value) return null
  const { total, withFoundationType, empty } = completeness.value
  if (total === 0) return 'Dit dossier heeft nog geen adressen. Voeg er minstens één toe in stap 2.'
  if (empty > 0) {
    return empty === 1
      ? '1 van de adressen is nog helemaal leeg. Zodra dat gevuld is kan het dossier ter controle.'
      : `${empty} van de ${total} adressen zijn nog helemaal leeg. Zodra die gevuld zijn kan het dossier ter controle.`
  }
  const missing = total - withFoundationType
  if (missing > 0) {
    return `${missing} van de ${total} adressen mist een funderingstype. Zodra dat gevuld is kan het dossier ter controle.`
  }
  return null
})

const phaseProgress = computed<Array<number | null>>(() => [completeness.value.ratio, null, null])

const people = computed(() => ({
  creator: inquiry.value?.attribution.creatorName ?? null,
  reviewer: inquiry.value?.attribution.reviewerName ?? null,
}))

/* ------------------------------------------------------------------ panels */

const metaLine = computed(() => {
  const row = inquiry.value
  if (!row) return ''
  return [
    `#${row.id}`,
    inquiryTypeLabel(row.type),
    formatDate(row.documentDate),
    row.attribution.contractorName ?? 'onbekende uitvoerder',
  ].join(' · ')
})

const details = computed<KeyValueItem[]>(() => {
  const row = inquiry.value
  if (!row) return []
  const items: KeyValueItem[] = [
    { label: 'Uitvoerder', value: row.attribution.contractorName },
    { label: 'Data-eigenaar', value: row.attribution.dataOwnerName },
    { label: 'Documentdatum', value: formatDateShort(row.documentDate), mono: true },
    { label: 'Aangemaakt', value: formatDateShort(row.record.createDate), mono: true },
    { label: 'F3O standaard', value: row.standardF3o ? 'Ja' : 'Nee' },
    { label: 'Inspectie', value: row.inspection ? 'Ja' : 'Nee' },
    { label: 'Voegmeting', value: row.jointMeasurement ? 'Ja' : 'Nee' },
    { label: 'Vloermeting', value: row.floorMeasurement ? 'Ja' : 'Nee' },
  ]
  if (row.note) items.push({ label: 'Notitie', value: row.note })
  return items
})

const involved = computed(() => {
  const row = inquiry.value
  if (!row) return []
  return [
    { name: row.attribution.creatorName, role: 'Opsteller · invoer' },
    { name: row.attribution.reviewerName, role: 'Beoordelaar · controle' },
  ].filter((person) => person.name)
})

/** Two initials from a display name, for the avatar circles. */
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
      what: from ? `${meta.label.toLowerCase()} uit “${statusLabelFor(from)}”` : meta.label.toLowerCase(),
      when: formatDateTime(event.date),
      note: event.note,
    }
  }),
)

const addressRows = computed(() =>
  samples.value.map((sample) => ({
    id: sample.id,
    label: formatAddress(addressStore.cache[sample.address]),
    filled: countFilledSampleFields(sample),
    ratio: sampleCompleteness(sample),
  })),
)

/**
 * Everything the entry says that is worth a second look, tagged with the
 * address it belongs to — the same list step 3 shows the person handing the
 * dossier over, shown again to the person taking it. A reviewer who has to
 * re-derive "an archiefonderzoek should not carry a handhavingstermijn" for
 * every dossier will eventually not derive it.
 */
const findings = computed(() =>
  samples.value.flatMap((sample) =>
    findingsFor(sample, inquiry.value?.type).map((finding) => ({
      id: `${sample.id}-${finding.id}`,
      address: formatAddress(addressStore.cache[sample.address]),
      message: finding.message,
    })),
  ),
)

/* ----------------------------------------------------------------- actions */

function goEdit() {
  router.push({ name: 'inquiry-edit-1', params: { id: inquiryId.value } })
}

function goInvoer() {
  router.push({ name: 'inquiry-edit-2', params: { id: inquiryId.value } })
}

/** Every write follows the same shape: confirm, call, reload, refresh counts. */
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
      body: `De beoordelaar krijgt bericht en het rapport wordt vergrendeld tot de controle klaar is.${
        completeness.value.empty ? ` Let op: ${completeness.value.empty} adres(sen) zijn nog leeg.` : ''
      }`,
      confirmLabel: 'Aanbieden',
    },
    () => api.inquiry.submitForReview(inquiryId.value),
    'Aangeboden ter review.',
  )
}

function handleApprove() {
  return run(
    {
      title: 'Rapport goedkeuren?',
      body: `${samples.value.length} adres(sen) worden vastgesteld en werken door in kaart en producten. Alleen een beheerder kan het rapport daarna nog heropenen.`,
      confirmLabel: 'Goedkeuren',
    },
    () => api.inquiry.approve(inquiryId.value),
    'Goedgekeurd.',
  )
}

function handleReopen() {
  return run(
    {
      title: 'Heropenen',
      body: "Goedgekeurd rapport heropenen voor correcties? De status keert terug naar 'In behandeling'.",
      confirmLabel: 'Heropenen',
    },
    () => api.inquiry.reset(inquiryId.value),
    'Heropend.',
  )
}

function handleDelete() {
  return run(
    {
      title: 'Rapport verwijderen?',
      body: `${samples.value.length} bijbehorend(e) adres(sen) worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    },
    async () => {
      await api.inquiry.remove(inquiryId.value)
      router.push({ name: 'inquiry-list' })
    },
    'Rapport verwijderd.',
  )
}

async function handleReject(message: string) {
  try {
    await api.inquiry.reject(inquiryId.value, message)
    showRejectModal.value = false
    toastSuccess('Afgekeurd en teruggestuurd naar de opsteller.')
    await load()
    studio.refreshCounts(sessionStore.currentUser?.id)
  } catch (e) {
    toastError(describeFailure(e, 'Afkeuren is niet gelukt.'))
  }
}

/**
 * Only bindings whose action is actually available are registered, so a
 * keystroke that cannot do anything falls through to the browser instead of
 * being swallowed.
 */
useActionShortcuts(() => {
  const actions: Record<string, () => void> = {}
  if (isEditable.value && canWrite.value) actions['⇧E'] = goEdit
  if (canSubmitForReview.value && canWrite.value) actions['⇧S'] = handleSubmitForReview
  if (isPendingReview.value && canApprove.value) {
    actions['⇧A'] = handleApprove
    actions['⇧R'] = () => (showRejectModal.value = true)
  }
  return actions
})
</script>

<template>
  <AppShell :crumb="inquiry?.documentName ?? 'Dossier'">
    <div class="grid grid-cols-[minmax(0,1fr)_var(--spacing-aside)] items-start gap-4.5 px-6 py-6">
      <div class="flex min-w-0 flex-col gap-4">
        <header v-if="inquiry" class="flex items-start gap-3.5">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-4xl font-display font-bold break-words text-ink">
                {{ inquiry.documentName }}
              </h1>
              <StatusBadge :status="inquiry.state.auditStatus" />
            </div>
            <p class="text-sm mt-1 font-mono text-faint">{{ metaLine }}</p>
          </div>

          <!-- Actions live next to the thing they act on, and destructive is
               marked rather than amplified: a white button with red text, not a
               red slab competing with "Aanbieden ter review". -->
          <div class="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
            <Button
              v-if="isEditable && canWrite"
              label="Bewerken"
              shortcut="⇧E"
              @click="goEdit"
            />
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

        <template v-else-if="inquiry">
          <Panel>
            <template #header>
              <span class="studio-caption">VOORTGANG</span>
              <span class="text-xs font-mono text-faint">
                {{ completeness.total }}
                {{ completeness.total === 1 ? 'adres' : 'adressen' }}
                <template v-if="completeness.total">
                  · {{ completeness.withFoundationType }} met funderingstype
                </template>
              </span>
            </template>

            <div class="flex flex-col gap-3.5">
              <PhaseCards
                :status="inquiry.state.auditStatus"
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

          <Panel v-if="findings.length" caption="TE CONTROLEREN WAARDEN" :meta="String(findings.length)">
            <ul class="flex flex-col gap-2">
              <li
                v-for="finding in findings"
                :key="finding.id"
                class="text-md flex gap-2.5 border-b border-canvas pb-2 last:border-b-0 last:pb-0"
              >
                <span aria-hidden="true" class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                <span class="min-w-0">
                  <span class="block font-semibold text-body">{{ finding.address }}</span>
                  <span class="block text-muted">{{ finding.message }}</span>
                </span>
              </li>
            </ul>
          </Panel>

          <div class="grid grid-cols-2 items-start gap-4">
            <Panel caption="DETAILS">
              <KeyValueList :items="details" />
            </Panel>

            <div class="flex flex-col gap-4">
              <DocumentCard :file="documentFile" :loading="documentLoading" />

              <Panel :meta="String(addressRows.length)">
                <template #header>
                  <span class="studio-caption">ADRESSEN</span>
                  <span class="text-xs font-mono text-faint">{{ addressRows.length }}</span>
                </template>

                <ul v-if="addressRows.length" class="flex flex-col gap-2">
                  <li v-for="address in addressRows" :key="address.id">
                    <button
                      type="button"
                      class="flex w-full flex-col gap-2 rounded-xl border border-line px-3 py-2.5 text-left hover:border-line-hover hover:bg-raised"
                      @click="goInvoer"
                    >
                      <span class="flex items-center gap-2.5">
                        <span class="text-lg min-w-0 flex-1 truncate font-semibold text-body">
                          {{ address.label }}
                        </span>
                        <span
                          class="text-sm shrink-0 font-mono"
                          :class="address.filled ? 'text-green-ink' : 'text-red'"
                        >
                          {{ address.filled }} velden
                        </span>
                      </span>
                      <ProgressBar
                        :value="address.ratio"
                        :tone="address.filled ? 'green' : 'red'"
                        :label="address.label"
                      />
                    </button>
                  </li>
                </ul>
                <EmptyState v-else>Nog geen adressen toegevoegd.</EmptyState>
              </Panel>
            </div>
          </div>

          <Panel v-if="samples.length" flush>
            <template #header>
              <span class="text-lg font-bold text-strong">Ingevoerde waarnemingen</span>
              <span class="text-xs font-mono text-faint">
                {{ samples.length }} {{ samples.length === 1 ? 'adres' : 'adressen' }}
              </span>
            </template>
            <!-- Reviewing? Open everything up — the reviewer should see the
                 data, not a list of addresses (issue #263, item 7). -->
            <SampleOverview :samples="samples" :expanded="isPendingReview" />
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
          <!-- Absent for dossiers older than `report.dossier_event`, and when
               the request failed — better no trail than a panel claiming an
               empty history. -->
          <EmptyState v-else>Geen geschiedenis vastgelegd voor dit dossier.</EmptyState>
        </Panel>
      </aside>
    </div>

    <RejectModal v-if="showRejectModal" @close="showRejectModal = false" @submit="handleReject" />
  </AppShell>
</template>
