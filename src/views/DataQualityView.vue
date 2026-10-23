<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import ColumnChart, { type ChartColumn } from '@/components/Common/ColumnChart.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import KpiTile from '@/components/Common/KpiTile.vue'
import PageHeader from '@/components/Common/PageHeader.vue'
import Panel from '@/components/Common/Panel.vue'
import ProgressBar from '@/components/Common/ProgressBar.vue'
import api from '@/services/fundermaps'
import { describeFailure } from '@/services/fundermaps/errors'
import type { IDataQuality } from '@/services/fundermaps/interfaces/IDataops'
import { INQUIRY_TYPE_CODE_LABELS } from '@/services/inquiryEnums'
import { statusMetaForPg } from '@/services/pipeline'
import { ALL_SAMPLE_FIELDS } from '@/services/sampleFields'
import { FOUNDATION_RESEARCH_REQUIRED_KEYS } from '@/services/sampleValidation'
import { formatDate } from '@/utils/date'

/**
 * Datakwaliteit (2026-10-23): what is in FunderMaps, how it got there and how
 * complete it is — the Grafana board "Data quality" moved into the Studio
 * (approved 2026-10-22), under INZICHT.
 *
 * Two dates, kept apart, because they answer different questions. When a row
 * came into the database (`create_date`): single days carry whole imports, so
 * per month that is how FunderMaps was filled, with the imports named — never
 * how much work was done. When the report itself was made (`document_date`):
 * the evidence's own age, back to the 1300s for archive research.
 *
 * Completeness is shown per field, because "incomplete" alone hides which part
 * is missing; and an empty field is not always an error — a report does not
 * state everything, and there is no foundation wood under concrete.
 */
const data = ref<IDataQuality | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.dataops.dataQuality()
  } catch (e) {
    error.value = describeFailure(e, 'De gegevens over de datakwaliteit konden niet worden opgehaald.')
  } finally {
    loading.value = false
  }
}
onBeforeMount(load)

const nl = (n: number) => n.toLocaleString('nl-NL')
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—')
/** "2021-09" → "sep 2021". */
const monthName = (m: string) =>
  new Date(`${m}-15T12:00:00Z`).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' })
// `note` sits outside the registry, under the form: the form calls it "Notitie bij dit adres".
const FIELD_LABEL = new Map<string, string>([...ALL_SAMPLE_FIELDS.map((f) => [f.key as string, f.label] as const), ['note', 'Notitie']])
const fieldLabel = (key: string) => FIELD_LABEL.get(key) ?? key
/** A label inside a sentence: first letter lower case, the rest as named ("risicoklasse QuickScan / Fase 0"). */
const inSentence = (label: string) => label.charAt(0).toLowerCase() + label.slice(1)

const d = computed(() => data.value)

/* ---- how FunderMaps was filled */
const addedColumns = computed<ChartColumn[]>(() => {
  const a = d.value?.added
  if (!a) return []
  // The months of the three biggest imports carry their number.
  const importMonths = new Set([...a.imports].sort((x, y) => y.samples - x.samples).slice(0, 3).map((i) => i.day.slice(0, 7)))
  return a.months.map((m, i) => ({
    key: m,
    tick: m.endsWith('-01') ? m.slice(0, 4) : '',
    values: [a.samples[i] ?? 0],
    describe: `${monthName(m)}: ${nl(a.samples[i] ?? 0)} monsters toegevoegd`,
    labelled: importMonths.has(m),
  }))
})
const imports = computed(() => [...(d.value?.added.imports ?? [])].sort((x, y) => y.samples - x.samples))

/* ---- how old the reports are */
// No tick on 1900: it stands right next to '<1900' and the two print over each other.
const TICK_YEARS = new Set(['before1900', '1925', '1950', '1975', '2000', '2025'])
const yearColumns = computed<ChartColumn[]>(() => {
  const y = d.value?.documentYears
  if (!y) return []
  const peak = Math.max(...y.inquiries)
  return y.years.map((year, i) => {
    const n = y.inquiries[i] ?? 0
    const name = year === 'before1900' ? 'Voor 1900' : year
    return {
      key: year,
      tick: TICK_YEARS.has(year) ? (year === 'before1900' ? '<1900' : year) : '',
      values: [n],
      describe: `${name}: ${nl(n)} ${n === 1 ? 'rapportage' : 'rapportages'}`,
      labelled: n === peak,
    }
  })
})

/** What the flat part of the year chart holds, in numbers: this year's spike would hide it otherwise. */
const periods = computed(() => {
  const y = d.value?.documentYears
  if (!y) return []
  const sumWhere = (test: (year: number) => boolean) =>
    y.years.reduce((n, year, i) => n + (test(year === 'before1900' ? 0 : Number(year)) ? (y.inquiries[i] ?? 0) : 0), 0)
  return [
    { label: 'vóór 1950', n: sumWhere((x) => x < 1950) },
    { label: '1950–1999', n: sumWhere((x) => x >= 1950 && x < 2000) },
    { label: '2000–2019', n: sumWhere((x) => x >= 2000 && x < 2020) },
    { label: 'sinds 2020', n: sumWhere((x) => x >= 2020) },
  ]
})

/* ---- per type, per status */
const TYPE_COLUMNS: DataColumn[] = [
  { field: 'type', title: 'Soort onderzoek', width: 'minmax(0,1fr)' },
  { field: 'inquiries', title: 'Rapportages', width: '110px', align: 'right' },
  { field: 'samples', title: 'Monsters', width: '100px', align: 'right' },
  { field: 'addedLastYear', title: 'Toegevoegd, 12 mnd', width: '150px', align: 'right' },
]
const typeRows = computed(() => (d.value?.byType ?? []).map((t) => ({ id: t.type, ...t })))
const statuses = computed(() => {
  const rows = d.value?.auditStatus ?? []
  const total = rows.reduce((n, r) => n + r.inquiries, 0)
  return rows.map((r) => ({ ...r, meta: statusMetaForPg(r.status), share: total ? r.inquiries / total : 0 }))
})

/* ---- QuickScans */
const qsColumns = computed<ChartColumn[]>(() => {
  const q = d.value?.quickscan
  if (!q) return []
  const last = q.months.length - 1
  return q.months.map((m, i) => {
    const all = q.samples[i] ?? 0
    const done = q.complete[i] ?? 0
    return {
      key: m,
      tick: m.endsWith('-01') ? monthName(m) : '',
      values: [done, all - done],
      describe: `${monthName(m)}: ${nl(all)} QuickScans, ${nl(done)} compleet`,
      labelled: i === last,
    }
  })
})
const QS_SERIES = [
  { label: 'compleet', tone: 'green' as const },
  { label: 'niet compleet', tone: 'amber' as const },
]
const qsRequiredLabels = computed(() => (d.value?.quickscan.required ?? []).map((k) => inSentence(fieldLabel(k))))
const qsFill = computed(() => {
  const f = d.value?.quickscan.fieldFill
  return (f?.fields ?? []).map((x) => ({ ...x, label: fieldLabel(x.field), share: f?.total ? x.filled / f.total : 0 }))
})
const QS_SHOWN = 8

/* ---- foundation research */
const foundationFill = computed(() => {
  const f = d.value?.foundationFill
  const all = (f?.fields ?? [])
    .map((x) => ({
      ...x,
      label: fieldLabel(x.field),
      share: f?.total ? x.filled / f.total : 0,
      required: FOUNDATION_RESEARCH_REQUIRED_KEYS.has(x.field as never),
    }))
    .sort((a, b) => b.share - a.share)
  // What the Studio's entry rules ask of a funderingsonderzoek first, then the rest.
  return [
    { key: 'required', title: 'Waar de invoerregels om vragen', fields: all.filter((x) => x.required) },
    { key: 'other', title: 'De overige velden', fields: all.filter((x) => !x.required) },
  ]
})

/* ---- bureaus */
const BUREAU_COLUMNS: DataColumn[] = [
  { field: 'name', title: 'Bureau', width: 'minmax(0,1fr)' },
  { field: 'samples', title: 'Monsters', width: '100px', align: 'right' },
  { field: 'share', title: 'Aandeel', width: '80px', align: 'right' },
]
const bureauRows = computed(() => {
  const rows = d.value?.bureaus ?? []
  const total = rows.reduce((n, r) => n + r.samples, 0)
  return rows.map((r, i) => ({ id: i, name: r.name ?? '(geen bureau)', samples: r.samples, share: pct(r.samples, total) }))
})
</script>

<template>
  <AppShell crumb="Datakwaliteit">
    <div class="flex flex-col gap-3 px-6 py-4">
      <PageHeader
        kicker="Inzicht"
        title="Datakwaliteit"
        purpose="Wat er in FunderMaps staat, hoe het erin kwam en hoe compleet het is."
      >
        <template #actions><Button label="Opnieuw ophalen" :disabled="loading" @click="load" /></template>
      </PageHeader>

      <Callout v-if="error" tone="red" :title="error" />
      <p v-else-if="loading && !d" class="text-md text-muted">Laden…</p>

      <template v-if="d">
        <Panel title="Wat er in staat">
          <div class="grid grid-cols-5 gap-3" role="list" aria-label="Wat er in FunderMaps staat">
            <KpiTile still role="listitem" label="Rapportages" :value="nl(d.totals.inquiries)" caption="onderzoeken" />
            <KpiTile still role="listitem" label="Monsters" :value="nl(d.totals.samples)" caption="adressen in die rapportages" />
            <KpiTile still role="listitem" label="Herstel" :value="nl(d.totals.recoveries)" caption="rapportages" />
            <KpiTile still role="listitem" label="Herstelmonsters" :value="nl(d.totals.recoverySamples)" caption="adressen" />
            <KpiTile
              still
              role="listitem"
              label="Oudste stuk"
              :value="d.totals.oldestYear ? String(d.totals.oldestYear) : '—'"
              caption="het jaar van het oudste rapport"
            />
          </div>
        </Panel>

        <Panel title="Hoe FunderMaps gevuld werd" :meta="`monsters toegevoegd per maand, sinds ${d.added.months[0]?.slice(0, 4)}`">
          <div class="flex flex-col gap-3">
            <ColumnChart :columns="addedColumns" :series="[{ label: 'monsters', tone: 'green' }]" label="Monsters toegevoegd per maand" />
            <p class="text-sm text-muted">
              Een maand zegt hier hoeveel er in FunderMaps bijkwam, niet hoeveel werk er die maand is gedaan: één dag
              kan een hele import zijn.
            </p>
            <ul v-if="imports.length" class="flex flex-wrap gap-x-6 gap-y-1" aria-label="Grote imports">
              <li v-for="i in imports" :key="i.day" class="text-sm text-body">
                <span class="font-mono text-faint">{{ formatDate(i.day) }}</span>
                {{ ' ' }}<strong class="font-mono tabular-nums text-strong">{{ nl(i.samples) }}</strong> monsters op één dag
              </li>
            </ul>
          </div>
        </Panel>

        <Panel title="Uit welk jaar de rapporten zijn" meta="rapportages per jaar van het rapport zelf">
          <div class="flex flex-col gap-3">
            <ColumnChart :columns="yearColumns" :series="[{ label: 'rapportages', tone: 'blue' }]" label="Rapportages per jaar van het rapport" />
            <p class="text-sm text-muted">
              Het oudste is uit {{ d.totals.oldestYear }}: archiefonderzoek gaat terug naar oude bouwdossiers. Alles vóór
              1900 staat in de eerste kolom.
            </p>
            <p class="text-sm text-body" aria-label="Rapportages per periode">
              <template v-for="(p, i) in periods" :key="p.label">
                <span v-if="i" class="text-faint">{{ ' · ' }}</span>{{ p.label }}
                <strong class="font-mono tabular-nums text-strong">{{ nl(p.n) }}</strong>
              </template>
            </p>
          </div>
        </Panel>

        <div class="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-3">
          <Panel title="Per soort onderzoek" :meta="`${d.byType.length} soorten`" flush>
            <DataTable :rows="typeRows" :columns="TYPE_COLUMNS" label="Per soort onderzoek" empty-message="Geen rapportages.">
              <template #type="{ row }"><span class="text-md truncate text-ink">{{ INQUIRY_TYPE_CODE_LABELS[row.type] ?? row.type }}</span></template>
              <template #inquiries="{ row }"><span class="font-mono tabular-nums text-strong">{{ nl(row.inquiries) }}</span></template>
              <template #samples="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.samples) }}</span></template>
              <template #addedLastYear="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.addedLastYear) }}</span></template>
            </DataTable>
          </Panel>
          <Panel title="Status van de rapportages" :meta="`${nl(d.totals.inquiries)} rapportages`">
            <ul class="flex flex-col gap-2.5" aria-label="Rapportages per status">
              <li v-for="s in statuses" :key="s.status" class="flex flex-col gap-1.5">
                <p class="text-base flex text-muted">
                  <span>{{ s.meta.label }}</span>
                  <span class="ml-auto font-mono tabular-nums text-strong">{{ nl(s.inquiries) }}</span>
                </p>
                <ProgressBar :value="s.share" :tone="s.meta.tone" size="md" :label="s.meta.label" />
              </li>
            </ul>
          </Panel>
        </div>

        <div class="grid grid-cols-2 items-start gap-3">
          <Panel title="QuickScans: wat is ingevuld" :meta="`${nl(d.quickscan.fieldFill.total)} in de laatste 12 maanden`">
            <div class="flex flex-col gap-4">
              <ul class="flex flex-col gap-2.5" aria-label="QuickScans: ingevuld per veld">
                <li v-for="f in qsFill" :key="f.field" class="flex flex-col gap-1.5">
                  <p class="text-base flex text-muted">
                    <span>{{ f.label }}</span>
                    <span class="ml-auto font-mono tabular-nums text-strong">{{ pct(f.filled, d.quickscan.fieldFill.total) }}</span>
                  </p>
                  <ProgressBar :value="f.share" :tone="f.share < 0.5 ? 'amber' : 'green'" size="md" :label="f.label" />
                </li>
              </ul>
              <div class="flex flex-col gap-2">
                <p class="studio-label">Per maand: compleet volgens de zes velden</p>
                <ColumnChart :columns="qsColumns" :series="QS_SERIES" label="QuickScans per maand, compleet en niet compleet" :height="72" />
                <p class="text-sm text-muted">
                  Compleet betekent hier: {{ qsRequiredLabels.join(', ') }} ingevuld — de definitie uit het oude
                  Grafana-bord. De invoerregels van de Studio rekenen een beoordeling óf een meting al als lood en lintvoeg.
                </p>
              </div>
              <div v-if="d.quickscan.incomplete.length" class="flex flex-col gap-1.5">
                <p class="studio-label">Laatst toegevoegd en niet compleet</p>
                <ul class="flex flex-col divide-y divide-divider" aria-label="Laatste QuickScans die niet compleet zijn">
                  <li v-for="r in d.quickscan.incomplete.slice(0, QS_SHOWN)" :key="r.sampleId" class="flex items-baseline gap-3 py-1.5">
                    <span class="text-sm shrink-0 font-mono text-faint">{{ formatDate(r.at) }}</span>
                    <RouterLink
                      :to="{ name: 'inquiry-view', params: { id: r.inquiryId } }"
                      class="text-md min-w-0 truncate text-ink hover:underline"
                    >
                      {{ r.documentName ?? `rapportage ${r.inquiryId}` }}
                    </RouterLink>
                    <span class="text-sm ml-auto shrink-0 text-subtle">mist: {{ r.missing.map((m) => inSentence(fieldLabel(m))).join(', ') }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </Panel>

          <Panel title="Funderingsonderzoek: wat is ingevuld" :meta="`${nl(d.foundationFill.total)} monsters`">
            <div class="flex flex-col gap-3">
              <p class="text-sm text-muted">
                Leeg is niet altijd fout: een rapport noemt niet alles, en onder beton zit geen funderingshout.
              </p>
              <div v-for="g in foundationFill" :key="g.key" class="flex flex-col gap-2">
                <p class="studio-label">{{ g.title }}</p>
                <ul class="grid grid-cols-2 gap-x-5 gap-y-2" :aria-label="`Funderingsonderzoek: ${g.title.toLowerCase()}`">
                  <li v-for="f in g.fields" :key="f.field" class="flex min-w-0 flex-col gap-1">
                    <p class="text-sm flex items-baseline gap-1.5 text-muted">
                      <span class="min-w-0 truncate" :title="f.label">{{ f.label }}</span>
                      <span class="ml-auto shrink-0 font-mono tabular-nums text-strong">{{ pct(f.filled, d.foundationFill.total) }}</span>
                    </p>
                    <ProgressBar :value="f.share" tone="green" :label="f.label" />
                  </li>
                </ul>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title="Per bureau" meta="monsters toegevoegd in de laatste 12 maanden" flush>
          <DataTable :rows="bureauRows" :columns="BUREAU_COLUMNS" label="Monsters per bureau" empty-message="Geen monsters in de laatste 12 maanden.">
            <template #name="{ row }"><span class="text-md truncate text-ink">{{ row.name }}</span></template>
            <template #samples="{ row }"><span class="font-mono tabular-nums text-strong">{{ nl(row.samples) }}</span></template>
            <template #share="{ row }"><span class="font-mono tabular-nums text-muted">{{ row.share }}</span></template>
          </DataTable>
        </Panel>
      </template>
    </div>
  </AppShell>
</template>
