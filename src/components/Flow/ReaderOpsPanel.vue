<script setup lang="ts">
import { computed } from 'vue'

import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import KpiTile from '@/components/Common/KpiTile.vue'
import Panel from '@/components/Common/Panel.vue'
import Sparkline from '@/components/Common/Sparkline.vue'
import type { IReaderOps } from '@/services/fundermaps/interfaces/IDataops'
import { formatDateTime } from '@/utils/date'

/**
 * The reader at work, last 30 days (2026-10-23): the Grafana board "Intake
 * pipeline" moved into the Datastroom (approved 2026-10-22). How much it read,
 * how often it failed, what it cost and how long a read takes, how much of
 * what it proposed was taken over; who reviewed how much; the mails that went
 * out; the reads that failed. Built from the Studio's own pieces only.
 */
const props = defineProps<{ ops: IReaderOps }>()

const nl = (n: number, digits = 0) => n.toLocaleString('nl-NL', { maximumFractionDigits: digits })
const usd = (n: number) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'USD' })
/** 160 → "2:40"; 41 → "41 s". */
const secs = (s: number | null | undefined) =>
  s == null ? '—' : s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
const median = (values: (number | null)[]) => {
  const v = values.filter((x): x is number => x != null).sort((a, b) => a - b)
  return v.length ? v[Math.floor(v.length / 2)]! : null
}

const t = computed(() => props.ops.totals)
const readsPerDay = computed(() => props.ops.days.map((_, i) => Object.values(props.ops.series.readsByLane).reduce((n, s) => n + (s[i] ?? 0), 0)))
const acceptance = computed(() => (t.value.judged ? `${nl((t.value.confirmed / t.value.judged) * 100, 1)}%` : '—'))
const p50 = computed(() => median(props.ops.series.p50))
const p95 = computed(() => median(props.ops.series.p95))
const decision = computed(() => {
  const h = t.value.medianDecisionHours
  return h == null ? null : h < 48 ? `${nl(h)} uur` : `${nl(h / 24)} dagen`
})

/** The kinds in the order a dossier meets them; a kind the API adds later shows under its own name. */
const MAIL_LABEL: Record<string, string> = {
  received: 'ontvangstbevestiging',
  question: 'vraag aan de melder',
  closed: 'afronding',
  risk_changed: 'risico herberekend',
}
const MAILS = computed(() => {
  const known = Object.keys(MAIL_LABEL)
  const keys = [...known.filter((k) => k in props.ops.series.mailsByKind), ...Object.keys(props.ops.series.mailsByKind).filter((k) => !known.includes(k))]
  return keys.map((key) => ({ key, label: MAIL_LABEL[key] ?? key, values: props.ops.series.mailsByKind[key] ?? [] }))
})
const sum = (a: number[]) => a.reduce((n, x) => n + x, 0)

const EFFORT_COLUMNS: DataColumn[] = [
  { field: 'person', title: 'Wie', width: 'minmax(0,1fr)' },
  { field: 'verdicts', title: 'Waarden', width: '90px', align: 'right' },
  { field: 'medianSeconds', title: 'Per waarde', width: '100px', align: 'right' },
  { field: 'hours', title: 'Uren', width: '70px', align: 'right' },
]
const effortRows = computed(() => (props.ops.effort ?? []).map((e, i) => ({ id: i, ...e })))
const FAILURE_COLUMNS: DataColumn[] = [
  { field: 'at', title: 'Wanneer', width: '140px' },
  { field: 'name', title: 'Document', width: 'minmax(0,1fr)' },
  { field: 'error', title: 'Fout', width: 'minmax(0,1.4fr)' },
]
const failureRows = computed(() => props.ops.failures.map((f) => ({ id: f.artifactId, ...f })))
</script>

<template>
  <!-- Panels side by side, as on the rest of the Datastroom: the figures, then the two tables and the mails. -->
  <div class="flex flex-col gap-3">
    <Panel title="De lezer aan het werk" meta="laatste 30 dagen">
      <div class="grid grid-cols-5 gap-3" role="list" aria-label="De lezer in getallen">
        <KpiTile still role="listitem" label="Gelezen" :value="nl(t.reads)" caption="documenten" tone="blue" :history="readsPerDay" />
        <KpiTile
          still
          role="listitem"
          label="Mislukt"
          :value="nl(t.failed)"
          caption="keer"
          :tone="t.failed ? 'red' : 'neutral'"
          :history="ops.series.failed"
        />
        <KpiTile still role="listitem" label="Kosten" :value="usd(t.costUsd)" caption="aan het taalmodel" :history="ops.series.usd" />
        <KpiTile
          still
          role="listitem"
          label="Leestijd"
          :value="secs(p50)"
          :caption="`mediaan · traag ${secs(p95)}`"
          :history="ops.series.p50.map((x) => x ?? 0)"
        />
        <KpiTile still role="listitem" label="Overgenomen" :value="acceptance" :caption="`van ${nl(t.judged)} waarden`" tone="green" />
      </div>
      <p v-if="decision" class="text-sm mt-3 text-muted">
        Van binnenkomst tot uitkomst duurt een dossier nu mediaan <strong class="text-strong">{{ decision }}</strong>
        (de archieflevering telt mee).
      </p>
    </Panel>

    <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
      <div class="flex flex-col gap-3">
        <!-- Who did how much: only administrators get it from the API (2026-10-23). -->
        <Panel v-if="ops.effort" title="Beoordelen per persoon" meta="laatste 30 dagen" flush>
          <DataTable :rows="effortRows" :columns="EFFORT_COLUMNS" label="Beoordelen per persoon" empty-message="Niemand beoordeelde in deze dagen.">
            <template #person="{ row }"><span class="text-md truncate text-ink">{{ row.person }}</span></template>
            <template #verdicts="{ row }"><span class="font-mono tabular-nums text-strong">{{ nl(row.verdicts) }}</span></template>
            <template #medianSeconds="{ row }"><span class="font-mono tabular-nums text-muted">{{ secs(row.medianSeconds) }}</span></template>
            <template #hours="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.hours, 1) }}</span></template>
          </DataTable>
        </Panel>
        <Panel title="Mails per dag" meta="laatste 30 dagen">
          <ul class="flex flex-col gap-1.5" aria-label="Mails per dag">
            <li v-for="m in MAILS" :key="m.key" class="flex items-center gap-3">
              <span class="text-md w-[200px] shrink-0 text-body">{{ m.label }}</span>
              <Sparkline :values="m.values" tone="blue" />
              <span class="text-sm ml-auto font-mono tabular-nums text-faint">{{ nl(sum(m.values)) }}</span>
            </li>
          </ul>
        </Panel>
      </div>
      <Panel title="Mislukte leesbeurten" :meta="`${ops.failures.length}`" flush>
        <DataTable :rows="failureRows" :columns="FAILURE_COLUMNS" label="Mislukte leesbeurten" empty-message="Geen mislukte leesbeurten in deze dagen.">
          <template #at="{ row }"><span class="text-sm font-mono text-faint">{{ formatDateTime(row.at) }}</span></template>
          <template #name="{ row }">
            <RouterLink
              v-if="row.dossierId"
              :to="{ name: 'review-dossier', params: { id: row.dossierId } }"
              class="text-md truncate text-ink hover:underline"
              @click.stop
            >
              {{ row.name ?? `document ${row.artifactId}` }}
            </RouterLink>
            <span v-else class="text-md truncate text-ink">{{ row.name ?? `document ${row.artifactId}` }}</span>
          </template>
          <template #error="{ row }"><span class="text-sm truncate text-red" :title="row.error ?? ''">{{ row.error }}</span></template>
        </DataTable>
      </Panel>
    </div>
  </div>
</template>
