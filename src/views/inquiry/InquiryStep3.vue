<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import WizardHeader from '@/components/Layout/WizardHeader.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import KeyValueList, { type KeyValueItem } from '@/components/Common/KeyValueList.vue'
import Panel from '@/components/Common/Panel.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import SampleOverview from '@/components/Inquiry/SampleOverview.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import { describeFailure } from '@/services/fundermaps/errors'
import { AUDIT_STATUS, inquiryTypeLabel } from '@/services/inquiryEnums'
import { countFilledSampleFields } from '@/services/sampleFields'
import { findingsFor } from '@/services/sampleValidation'
import { confirmAction } from '@/services/confirm'
import { toastError, toastSuccess } from '@/services/toast'
import { formatAddress } from '@/utils/address'
import { formatDateShort } from '@/utils/date'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { inquirySteps } from '@/services/wizard'
import { useAddressStore } from '@/stores/address'
import { useSessionStore } from '@/stores/session'
import { useStudioStore } from '@/stores/studio'

/**
 * Step 3 — read it back, then hand it over.
 *
 * The last chance to catch something before a reviewer's time is spent on it,
 * so the page leads with what is *wrong* rather than with what is there: empty
 * addresses and every cross-field finding across the whole dossier collected
 * into one list. Below that, the dossier as the reviewer will see it.
 *
 * A missing foundation type is *not* one of those wrongs — a sample records what
 * the report observed, and plenty of reports observe an address without ever
 * establishing its foundation type.
 */
const route = useRoute()
const router = useRouter()
const addressStore = useAddressStore()
const sessionStore = useSessionStore()
const studio = useStudioStore()

const inquiryId = computed(() => Number(route.params.id))

const inquiry: Ref<IInquiry | null> = ref(null)
const samples: Ref<IInquirySample[]> = ref([])
const loading = ref(true)
const submitting = ref(false)

async function load() {
  try {
    loading.value = true
    const [i, s] = await Promise.all([
      api.inquiry.getById(inquiryId.value),
      api.inquirySample.listAll(inquiryId.value),
    ])
    inquiry.value = i
    samples.value = s
    await addressStore.ensureMany(s.map((row) => row.address))
  } catch (e) {
    toastError(describeFailure(e, 'Het dossier kon niet worden opgehaald.'))
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

const canSubmit = computed(() => {
  const status = inquiry.value?.state.auditStatus
  return (
    samples.value.length > 0 &&
    (status === AUDIT_STATUS.TODO ||
      status === AUDIT_STATUS.PENDING ||
      status === AUDIT_STATUS.REJECTED)
  )
})

/* ------------------------------------------------------------- the checks */

const emptyAddresses = computed(() =>
  samples.value.filter((s) => countFilledSampleFields(s) === 0),
)

/**
 * Every cross-field finding in the dossier, tagged with the address it belongs
 * to. Collected here rather than left in the editor because this is the moment
 * someone reads the whole thing at once — one list of eight beats eight visits.
 */
const findings = computed(() =>
  samples.value.flatMap((sample) =>
    findingsFor(sample, {
      inquiryType: inquiry.value?.type,
      documentDate: inquiry.value?.documentDate,
      bagBuiltYear: addressStore.cache[sample.address]?.built_year,
    }).map((finding) => ({
      id: `${sample.id}-${finding.id}`,
      address: formatAddress(addressStore.cache[sample.address]),
      message: finding.message,
    })),
  ),
)

const isClean = computed(
  () =>
    samples.value.length > 0 &&
    !emptyAddresses.value.length &&
    !findings.value.length,
)

const summary = computed<KeyValueItem[]>(() => {
  const row = inquiry.value
  if (!row) return []
  return [
    { label: 'Naam', value: row.documentName },
    { label: 'Type', value: inquiryTypeLabel(row.type) },
    { label: 'Documentdatum', value: formatDateShort(row.documentDate), mono: true },
    { label: 'Opsteller', value: row.attribution.creatorName },
    { label: 'Beoordelaar', value: row.attribution.reviewerName },
    { label: 'Uitvoerder', value: row.attribution.contractorName },
    ...(row.note ? [{ label: 'Notitie', value: row.note }] : []),
  ]
})

/* ----------------------------------------------------------------- submit */

async function submit() {
  if (!canSubmit.value || submitting.value) return

  const warnings: string[] = []
  if (emptyAddresses.value.length) {
    warnings.push(`${emptyAddresses.value.length} adres(sen) zijn nog helemaal leeg.`)
  }
  if (findings.value.length) {
    warnings.push(`${findings.value.length} waarde(n) zijn nog niet gecontroleerd.`)
  }

  const ok = await confirmAction({
    title: 'Aanbieden ter review?',
    body: [
      'De beoordelaar krijgt bericht en het rapport wordt vergrendeld tot de controle klaar is.',
      ...(warnings.length ? [`Let op: ${warnings.join(' ')}`] : []),
    ].join('\n\n'),
    confirmLabel: 'Aanbieden',
  })
  if (!ok) return

  submitting.value = true
  try {
    await api.inquiry.submitForReview(inquiryId.value)
    toastSuccess('Aangeboden ter review.')
    studio.refreshCounts(sessionStore.currentUser?.id)
    router.push({ name: 'inquiry-view', params: { id: inquiryId.value } })
  } catch (e) {
    toastError(describeFailure(e, 'Aanbieden is niet gelukt.'))
  } finally {
    submitting.value = false
  }
}

function previous() {
  router.push({ name: 'inquiry-edit-2', params: { id: inquiryId.value } })
}

const steps = computed(() => inquirySteps(inquiryId.value))

useActionShortcuts((): Record<string, () => void> =>
  canSubmit.value ? { '⌘↵': () => void submit() } : {},
)
</script>

<template>
  <AppShell :crumb="inquiry ? `Controle · ${inquiry.documentName}` : 'Controle'">
    <WizardHeader
      :title="inquiry ? `Controle · ${inquiry.documentName}` : 'Controle'"
      :status="`#${inquiryId} · ${samples.length} ${samples.length === 1 ? 'adres' : 'adressen'}`"
      :steps="steps"
      :current="3"
    >
      <template #actions>
        <StatusBadge v-if="inquiry" :status="inquiry.state.auditStatus" />
        <Button label="Vorige" @click="previous" />
        <Button
          variant="primary"
          label="Aanbieden ter review"
          shortcut="⌘↵"
          :disabled="!canSubmit || submitting"
          @click="submit"
        />
      </template>
    </WizardHeader>

    <div class="flex flex-col gap-4 px-6 py-5">
      <EmptyState v-if="loading">Dossier ophalen…</EmptyState>

      <template v-else-if="inquiry">
        <Callout v-if="!samples.length" tone="red" title="Nog geen adressen">
          Voeg minstens één adres toe in stap 2 voordat je dit dossier aanbiedt.
          <template #action>
            <Button label="Naar invoer" @click="previous" />
          </template>
        </Callout>

        <Callout v-else-if="isClean" tone="green" title="Klaar om aan te bieden">
          Alle {{ samples.length }} adressen zijn gevuld en er zijn geen waarden die elkaar
          tegenspreken.
        </Callout>

        <template v-else>
          <Callout
            v-if="emptyAddresses.length"
            tone="amber"
            :title="`${emptyAddresses.length} ${emptyAddresses.length === 1 ? 'adres is' : 'adressen zijn'} nog leeg`"
          >
            {{ emptyAddresses.map((s) => formatAddress(addressStore.cache[s.address])).join(', ') }}
            <template #action>
              <Button label="Naar invoer" @click="previous" />
            </template>
          </Callout>

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
        </template>

        <div class="grid grid-cols-[minmax(0,1fr)_var(--spacing-aside)] items-start gap-4">
          <Panel flush>
            <template #header>
              <span class="text-lg font-bold text-strong">Adressen</span>
              <span class="text-xs font-mono text-faint">{{ samples.length }}</span>
            </template>
            <SampleOverview v-if="samples.length" :samples="samples" />
            <EmptyState v-else>Nog geen adressen toegevoegd.</EmptyState>
          </Panel>

          <Panel caption="RAPPORT">
            <KeyValueList :items="summary" ratio="42%" />
          </Panel>
        </div>
      </template>
    </div>
  </AppShell>
</template>
