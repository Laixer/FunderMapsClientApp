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
import Pill from '@/components/Common/Pill.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'

import api from '@/services/fundermaps'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import type { IRecoverySample } from '@/services/fundermaps/interfaces/IRecoverySample'
import { describeFailure } from '@/services/fundermaps/errors'
import {
  AUDIT_STATUS,
  FACADE_LABELS,
  recoveryDocumentTypeLabel,
  recoveryStatusLabel,
  recoveryTypeLabel,
} from '@/services/recoveryEnums'
import { confirmAction } from '@/services/confirm'
import { toastError, toastSuccess } from '@/services/toast'
import { formatAddress } from '@/utils/address'
import { formatDateShort } from '@/utils/date'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { recoverySteps } from '@/services/wizard'
import { useAddressStore } from '@/stores/address'
import { useSessionStore } from '@/stores/session'
import { useStudioStore } from '@/stores/studio'

/**
 * Step 3 of the herstel wizard — read it back, then hand it over.
 *
 * The check that matters here is "hersteltype onbekend": a repair recorded
 * without saying what kind of repair it was carries almost none of its value
 * into the map, and `5 / unknown` is the default a new sample starts at, so it
 * is easy to leave behind.
 */
const route = useRoute()
const router = useRouter()
const addressStore = useAddressStore()
const sessionStore = useSessionStore()
const studio = useStudioStore()

const recoveryId = computed(() => Number(route.params.id))

const recovery: Ref<IRecovery | null> = ref(null)
const samples: Ref<IRecoverySample[]> = ref([])
const loading = ref(true)
const submitting = ref(false)

async function load() {
  try {
    loading.value = true
    const [r, s] = await Promise.all([
      api.recovery.getById(recoveryId.value),
      api.recoverySample.listAll(recoveryId.value),
    ])
    recovery.value = r
    samples.value = s
    await addressStore.ensureMany(s.map((row) => row.building))
  } catch (e) {
    toastError(describeFailure(e, 'Het dossier kon niet worden opgehaald.'))
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

const canSubmit = computed(() => {
  const status = recovery.value?.state.auditStatus
  return (
    samples.value.length > 0 &&
    (status === AUDIT_STATUS.TODO ||
      status === AUDIT_STATUS.PENDING ||
      status === AUDIT_STATUS.REJECTED)
  )
})

/** `5` is the `unknown` member of recovery_type, and the default a sample starts at. */
const unknownType = computed(() => samples.value.filter((s) => s.type === 5))

const summary = computed<KeyValueItem[]>(() => {
  const row = recovery.value
  if (!row) return []
  return [
    { label: 'Naam', value: row.documentName },
    { label: 'Documenttype', value: recoveryDocumentTypeLabel(row.type) },
    { label: 'Documentdatum', value: formatDateShort(row.documentDate), mono: true },
    { label: 'Opsteller', value: row.attribution.creatorName },
    { label: 'Beoordelaar', value: row.attribution.reviewerName },
    { label: 'Uitvoerder', value: row.attribution.contractorName },
    ...(row.note ? [{ label: 'Notitie', value: row.note }] : []),
  ]
})

function facades(sample: IRecoverySample): string {
  if (!sample.facade?.length) return '—'
  return sample.facade.map((value) => FACADE_LABELS[value] ?? String(value)).join(', ')
}

async function submit() {
  if (!canSubmit.value || submitting.value) return

  const ok = await confirmAction({
    title: 'Aanbieden ter review?',
    body: [
      'De beoordelaar krijgt bericht en het dossier wordt vergrendeld tot de controle klaar is.',
      ...(unknownType.value.length
        ? [`Let op: ${unknownType.value.length} pand(en) hebben nog hersteltype "Onbekend".`]
        : []),
    ].join('\n\n'),
    confirmLabel: 'Aanbieden',
  })
  if (!ok) return

  submitting.value = true
  try {
    await api.recovery.submitForReview(recoveryId.value)
    toastSuccess('Aangeboden ter review.')
    studio.refreshCounts(sessionStore.currentUser?.id)
    router.push({ name: 'recovery-view', params: { id: recoveryId.value } })
  } catch (e) {
    toastError(describeFailure(e, 'Aanbieden is niet gelukt.'))
  } finally {
    submitting.value = false
  }
}

function previous() {
  router.push({ name: 'recovery-edit-2', params: { id: recoveryId.value } })
}

const steps = computed(() => recoverySteps(recoveryId.value))

useActionShortcuts((): Record<string, () => void> =>
  canSubmit.value ? { '⌘↵': () => void submit() } : {},
)
</script>

<template>
  <AppShell :crumb="recovery ? `Controle · ${recovery.documentName}` : 'Controle'">
    <WizardHeader
      :title="recovery ? `Controle · ${recovery.documentName}` : 'Controle'"
      :status="`#${recoveryId} · ${samples.length} ${samples.length === 1 ? 'pand' : 'panden'}`"
      :steps="steps"
      :current="3"
    >
      <template #actions>
        <StatusBadge v-if="recovery" :status="recovery.state.auditStatus" />
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

      <template v-else-if="recovery">
        <Callout v-if="!samples.length" tone="red" title="Nog geen panden">
          Voeg minstens één pand toe in stap 2 voordat je dit dossier aanbiedt.
          <template #action>
            <Button label="Naar invoer" @click="previous" />
          </template>
        </Callout>

        <Callout
          v-else-if="unknownType.length"
          tone="amber"
          :title="`${unknownType.length} ${unknownType.length === 1 ? 'pand heeft' : 'panden hebben'} nog hersteltype “Onbekend”`"
        >
          Zonder hersteltype zegt het dossier wel dát er hersteld is, maar niet hoe — en dat is
          precies wat de kaart ervan gebruikt.
          <template #action>
            <Button label="Naar invoer" @click="previous" />
          </template>
        </Callout>

        <Callout v-else tone="green" title="Klaar om aan te bieden">
          Alle {{ samples.length }} panden hebben een hersteltype.
        </Callout>

        <div class="grid grid-cols-[minmax(0,1fr)_var(--spacing-aside)] items-start gap-4">
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
                </div>
                <p class="text-sm font-mono text-faint">
                  {{ recoveryStatusLabel(sample.status) }} · gevels: {{ facades(sample) }}
                  <template v-if="sample.recoveryDate">
                    · uitgevoerd {{ formatDateShort(sample.recoveryDate) }}
                  </template>
                </p>
                <p v-if="sample.note" class="text-md text-muted">{{ sample.note }}</p>
              </li>
            </ul>
            <EmptyState v-else>Nog geen panden toegevoegd.</EmptyState>
          </Panel>

          <Panel caption="DOSSIER">
            <KeyValueList :items="summary" ratio="42%" />
          </Panel>
        </div>
      </template>
    </div>
  </AppShell>
</template>
