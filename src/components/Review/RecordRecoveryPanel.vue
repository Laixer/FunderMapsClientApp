<script setup lang="ts">
/**
 * Herstel vastleggen (#341): a dossier about a herstel becomes a
 * report.recovery with one sample per pand, the dossier's document as its
 * document. The reading does not propose herstel fields, so the reviewer gives
 * them here; the melder's "Soort herstel" is shown as a hint, never as a value.
 *
 * It does not close the dossier: a herstel drawing usually also shows the
 * original foundation type, which the reviewer can still take over and commit
 * as a rapportage below.
 */
import { computed, ref } from 'vue'

import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'
import api from '@/services/fundermaps'
import { describeFailure } from '@/services/fundermaps/errors'
import type { IDossierAddress } from '@/services/fundermaps/interfaces/IDataops'
import type { SelectOption } from '@/services/options'
import {
  PILE_TYPE_LABELS,
  RECOVERY_DOCUMENT_TYPE_LABELS,
  RECOVERY_STATUS_LABELS,
  RECOVERY_TYPE_LABELS,
} from '@/services/recoveryEnums'

const props = defineProps<{
  dossierId: number
  addresses: IDossierAddress[]
  /** What the melder wrote under "Soort herstel", if anything. */
  melderHint?: string | null
  /** A document date the reviewer already took over, to start from. */
  suggestedDate?: string | null
  disabled?: boolean
}>()
const emit = defineEmits<{ recorded: [recoveryId: number]; error: [message: string] }>()

// The API takes the database's enum labels; the Studio's tables are keyed by
// the integer wire value in the same order (lib/inquiry-enums.ts in the API).
const DOCUMENT_TYPE_CODES = ['permit', 'foundation_report', 'archive_report', 'owner_evidence', 'unknown']
const RECOVERY_TYPE_CODES = ['table', 'beam_on_pile', 'pile_lowering', 'pile_in_wall', 'injection', 'unknown']
const STATUS_CODES = ['planned', 'requested', 'executed']
const PILE_TYPE_CODES = ['press', 'internally_driven', 'segment']
const options = (codes: string[], labels: Record<number, string>): SelectOption[] =>
  codes.map((code, i) => ({ value: code, label: labels[i] ?? code }))

const documentType = ref('')
const documentDate = ref(props.suggestedDate ?? '')
const recoveryType = ref('')
const status = ref('executed')
const pileType = ref('')
const recoveryDate = ref('')
const permit = ref('')
const note = ref('')
const busy = ref(false)
const recordedId = ref<number | null>(null)

/** One row per pand the dossier is about; rejected addresses never count. */
const panden = computed(() => {
  const seen = new Map<string, { buildingId: string; label: string; own: boolean }>()
  for (const a of props.addresses) {
    if (!a.buildingId || a.state === 'rejected' || seen.has(a.buildingId)) continue
    seen.set(a.buildingId, { buildingId: a.buildingId, label: a.label ?? a.addressText ?? a.buildingId, own: a.own })
  }
  return [...seen.values()].sort((a, b) => Number(b.own) - Number(a.own))
})
const chosen = ref<Record<string, boolean>>({})
const isChosen = (id: string) => chosen.value[id] ?? true
const chosenPanden = computed(() => panden.value.filter((p) => isChosen(p.buildingId)))

const missing = computed(() => {
  if (!documentType.value) return 'Kies het soort document.'
  if (!documentDate.value) return 'Vul de datum van het document in.'
  if (!recoveryType.value) return 'Kies het soort herstel.'
  if (!chosenPanden.value.length) return 'Kies minstens één pand.'
  return null
})

async function record() {
  if (missing.value || busy.value) return
  busy.value = true
  try {
    const r = await api.dataops.recordRecovery(props.dossierId, {
      documentType: documentType.value,
      documentDate: documentDate.value,
      note: note.value.trim() || null,
      samples: chosenPanden.value.map((p) => ({
        building: p.buildingId,
        type: recoveryType.value,
        status: status.value || null,
        pileType: pileType.value || null,
        recoveryDate: recoveryDate.value || null,
        permit: permit.value.trim() || null,
      })),
    })
    recordedId.value = r.recoveryId
    emit('recorded', r.recoveryId)
  } catch (e) {
    emit('error', describeFailure(e, 'Het herstel kon niet worden vastgelegd.'))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Panel caption="HERSTEL VASTLEGGEN" :meta="recordedId ? `#${recordedId}` : undefined">
    <Callout v-if="recordedId" tone="green" title="Herstel vastgelegd">
      Herstel
      <RouterLink :to="{ name: 'recovery-view', params: { id: recordedId } }" class="font-semibold underline">
        #{{ recordedId }}
      </RouterLink>
      staat in de database met dit document. Sluit het dossier hieronder af, met of zonder rapportage voor het
      oorspronkelijke funderingstype.
    </Callout>

    <div v-else class="flex flex-col gap-3">
      <p class="text-sm text-muted">
        Voor een tekening of oplevering van een herstel. Legt een herstel vast per pand, met dit document erbij.
        Het dossier blijft open: het oorspronkelijke funderingstype kun je daarna nog als rapportage overnemen.
      </p>
      <p v-if="melderHint" class="text-sm">
        <span class="mr-1.5 font-semibold uppercase text-label">Melder</span>
        <span class="text-muted">{{ melderHint }}</span>
      </p>

      <div class="grid grid-cols-3 gap-x-3 gap-y-2">
        <Field
          id="herstel-document-type"
          v-model="documentType"
          kind="select"
          label="Soort document"
          placeholder="Kies…"
          :options="options(DOCUMENT_TYPE_CODES, RECOVERY_DOCUMENT_TYPE_LABELS)"
          required
        />
        <Field id="herstel-document-date" v-model="documentDate" kind="date" label="Datum document" required />
        <Field
          id="herstel-type"
          v-model="recoveryType"
          kind="select"
          label="Soort herstel"
          placeholder="Kies…"
          :options="options(RECOVERY_TYPE_CODES, RECOVERY_TYPE_LABELS)"
          required
        />
        <Field
          id="herstel-status"
          v-model="status"
          kind="select"
          label="Status"
          :options="options(STATUS_CODES, RECOVERY_STATUS_LABELS)"
        />
        <Field
          id="herstel-pile-type"
          v-model="pileType"
          kind="select"
          label="Paaltype"
          placeholder="Geen of onbekend"
          :options="options(PILE_TYPE_CODES, PILE_TYPE_LABELS)"
        />
        <Field id="herstel-date" v-model="recoveryDate" kind="date" label="Datum herstel" />
        <Field id="herstel-permit" v-model="permit" label="Vergunning" placeholder="Kenmerk, als het document er een noemt" />
        <Field id="herstel-note" v-model="note" class="col-span-2" label="Toelichting" placeholder="Bijvoorbeeld: 99 stalen buispalen ø168" />
      </div>

      <fieldset class="flex flex-col gap-1">
        <legend class="mb-1 text-sm font-semibold uppercase tracking-wide text-label">
          Panden ({{ chosenPanden.length }} van {{ panden.length }})
        </legend>
        <p v-if="!panden.length" class="text-sm text-amber-ink">
          Dit dossier heeft nog geen pand of bevestigd adres. Koppel eerst een adres hierboven.
        </p>
        <label v-for="p in panden" :key="p.buildingId" class="flex items-center gap-2 text-md">
          <input
            :id="`herstel-pand-${p.buildingId}`"
            type="checkbox"
            :checked="isChosen(p.buildingId)"
            @change="chosen = { ...chosen, [p.buildingId]: ($event.target as HTMLInputElement).checked }"
          />
          <span>{{ p.label }}</span>
          <span v-if="p.own" class="text-sm text-faint">pand van de melding</span>
        </label>
      </fieldset>

      <div class="flex items-center gap-3">
        <Button
          variant="primary"
          label="Herstel vastleggen"
          :disabled="disabled || busy || !!missing"
          :title="missing ?? ''"
          @click="record"
        />
        <span v-if="missing" class="text-sm text-faint">{{ missing }}</span>
      </div>
    </div>
  </Panel>
</template>
