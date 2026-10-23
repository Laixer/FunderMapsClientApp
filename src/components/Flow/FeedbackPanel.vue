<script setup lang="ts">
import { computed } from 'vue'

import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import KpiTile from '@/components/Common/KpiTile.vue'
import Panel from '@/components/Common/Panel.vue'
import type { IFeedback } from '@/services/fundermaps/interfaces/IDataops'
import { TONE_DOT, TONE_FILL } from '@/services/tone'
import { formatDate } from '@/utils/date'

/**
 * Terugmeldingen (2026-10-23): what owners and advisers report back about a
 * building's foundation information, since 2014 — the Grafana board
 * "Terugmeldingen" moved into the Datastroom (approved 2026-10-22).
 *
 * The year chart holds the incident portal and melden.fundermaps.com only. The
 * FunderConsult archive came in all at once in 2026 while its reports are
 * older, so a bar for it would put thousands of reports in a year they were
 * not made in; it is a count, and the note under the chart says why.
 *
 * Colours (validated, dataviz validate_palette.js against white): the portal
 * blue, melden green — ours. Green is under 3:1 on white, so the chart carries
 * a legend, direct labels and a per-year list for screen readers.
 */
const props = defineProps<{ feedback: IFeedback }>()

const nl = (n: number) => n.toLocaleString('nl-NL')
const t = computed(() => props.feedback.totals)
const handled = computed(() => (t.value.handledShare == null ? '—' : `${Math.round(t.value.handledShare * 100)}%`))
const leadTime = computed(() => {
  const h = t.value.meldenMedianHours
  // A no-break space: the number and its unit are one value, never two lines.
  return h == null ? '—' : h < 48 ? `${Math.round(h)}\u00a0uur` : `${Math.round(h / 24)}\u00a0dagen`
})

const COLUMN_PX = 112
const years = computed(() => {
  const ys = props.feedback.perYear
  const max = Math.max(1, ...ys.map((y) => y.portal + y.melden))
  const peak = ys.reduce((best, y) => (y.portal > best.portal ? y : best), ys[0]!)
  const last = ys[ys.length - 1]!
  return ys.map((y) => {
    const total = y.portal + y.melden
    return {
      ...y,
      total,
      portalPx: y.portal ? Math.max(2, Math.round((y.portal / max) * COLUMN_PX)) : 0,
      meldenPx: y.melden ? Math.max(2, Math.round((y.melden / max) * COLUMN_PX)) : 0,
      // Selective labels: the portal's busiest year and this year, not a number on every bar.
      labelled: y === peak || y === last,
      describe: `${y.year}: ${nl(y.portal)} via het incidentportaal${y.melden ? `, ${nl(y.melden)} via melden.fundermaps.com` : ''}`,
    }
  })
})

const SUBJECT_COLUMNS: DataColumn[] = [
  { field: 'subject', title: 'Onderwerp', width: 'minmax(0,1fr)' },
  { field: 'received', title: 'Meldingen', width: '90px', align: 'right' },
  { field: 'handled', title: 'Afgehandeld', width: '100px', align: 'right' },
  { field: 'ledToReport', title: 'Tot rapportage', width: '120px', align: 'right' },
]
const subjectRows = computed(() => props.feedback.subjects.map((s) => ({ id: s.subject, ...s })))
</script>

<template>
  <div class="flex flex-col gap-3">
    <Panel title="Terugmeldingen" meta="wat eigenaren en adviseurs ons terugmelden, sinds 2014">
      <div class="grid grid-cols-5 gap-3" role="list" aria-label="Terugmeldingen in getallen">
        <KpiTile still role="listitem" label="Terugmeldingen" :value="nl(t.all)" caption="uit drie bronnen" />
        <KpiTile still role="listitem" label="Via melden" :value="nl(t.melden)" caption="melden.fundermaps.com" tone="green" />
        <KpiTile still role="listitem" label="Afgehandeld" :value="handled" :caption="`archief en melden · ${nl(t.open)} open`" />
        <KpiTile still role="listitem" label="Doorlooptijd" :value="leadTime" caption="mediaan, tot uitkomst" />
        <KpiTile
          still
          role="listitem"
          label="Risico herberekend"
          :value="nl(t.riskMailed)"
          :caption="t.riskMailedSince ? `gemaild sinds ${formatDate(t.riskMailedSince)}` : 'gemaild'"
          tone="green"
        />
      </div>
    </Panel>

    <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
      <Panel title="Per jaar" :meta="`${feedback.perYear[0]?.year}–${feedback.perYear[feedback.perYear.length - 1]?.year}`">
        <div class="flex flex-col gap-3">
          <div class="text-sm flex items-center gap-4 text-muted" aria-hidden="true">
            <span class="flex items-center gap-1.5"><span class="size-2 rounded-full" :class="TONE_DOT.blue" />incidentportaal</span>
            <span class="flex items-center gap-1.5"><span class="size-2 rounded-full" :class="TONE_DOT.green" />melden.fundermaps.com</span>
          </div>
          <ol class="flex items-end gap-1.5" role="list" aria-label="Terugmeldingen per jaar">
            <li
              v-for="y in years"
              :key="y.year"
              class="flex min-w-0 flex-1 flex-col items-center gap-1"
              :aria-label="y.describe"
              :title="y.describe"
            >
              <span class="text-xs h-4 font-mono tabular-nums text-muted" aria-hidden="true">{{ y.labelled ? nl(y.total) : '' }}</span>
              <span class="flex w-full max-w-[28px] flex-col justify-end gap-[2px]" :style="{ height: `${COLUMN_PX}px` }" aria-hidden="true">
                <span v-if="y.meldenPx" class="w-full rounded-t-[4px]" :class="TONE_FILL.green" :style="{ height: `${y.meldenPx}px` }" />
                <span
                  v-if="y.portalPx"
                  class="w-full"
                  :class="[TONE_FILL.blue, y.meldenPx ? '' : 'rounded-t-[4px]']"
                  :style="{ height: `${y.portalPx}px` }"
                />
              </span>
              <span class="text-xs font-mono tabular-nums text-faint" aria-hidden="true">{{ y.year.slice(2) }}</span>
            </li>
          </ol>
          <p class="text-sm text-muted">
            Het archief van FunderConsult ({{ nl(t.archive) }}) staat hier niet in: het kwam in 2026 in één keer binnen,
            de meldingen zelf zijn ouder.
          </p>
        </div>
      </Panel>
      <Panel title="Waarover" meta="via melden.fundermaps.com" flush>
        <DataTable :rows="subjectRows" :columns="SUBJECT_COLUMNS" label="Terugmeldingen per onderwerp" empty-message="Nog geen meldingen.">
          <template #subject="{ row }"><span class="text-md truncate text-ink">{{ row.subject }}</span></template>
          <template #received="{ row }"><span class="font-mono tabular-nums text-strong">{{ nl(row.received) }}</span></template>
          <template #handled="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.handled) }}</span></template>
          <template #ledToReport="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.ledToReport) }}</span></template>
        </DataTable>
      </Panel>
    </div>
  </div>
</template>
