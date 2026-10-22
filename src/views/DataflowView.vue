<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeMount, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import FlowDiagram from '@/components/Flow/FlowDiagram.vue'
import PageHeader from '@/components/Common/PageHeader.vue'
import Panel from '@/components/Common/Panel.vue'
import Sparkline from '@/components/Common/Sparkline.vue'
import ReaderQualityPanel from '@/components/Flow/ReaderQualityPanel.vue'
// MapLibre is large: the map loads when this page shows it, not with the Studio.
const OriginMap = defineAsyncComponent(() => import('@/components/Mapbox/OriginMap.vue'))

import api from '@/services/fundermaps'
import type { IDataopsFlow, IDataopsMap, IReaderQuality } from '@/services/fundermaps/interfaces/IDataops'
import { loadReaderQuality } from '@/services/readerTrack'
import { describeFailure } from '@/services/fundermaps/errors'
import { AGE_BANDS, buildFlow, GROUPS, SOURCES, sourceRows, type FlowGroup, type SourceRow } from '@/services/dataflow'

/**
 * Datastroom: where everything that came in went (2026-10-22).
 *
 * The first page of the Studio that is about the data rather than about the
 * work: one picture of every dossier from its source to where it ended up,
 * and per source what came in and went out over the last twelve weeks. Every
 * part of the picture opens the matching slice in Controle.
 *
 * Counted by the API in one round (GET /dataops/flow); nothing here is
 * estimated. The numbers are as of the moment the page loaded, said in the
 * header, with a button to count again.
 */
const data = ref<IDataopsFlow | null>(null)
/** How well the reader reads, per field; its own request, so a failure leaves the rest of the page standing. */
const quality = ref<IReaderQuality | null>(null)
/** Where the dossiers come from, per municipality; its own request, like the reader's record. */
const places = ref<IDataopsMap | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load(force = false) {
  loading.value = true
  error.value = null
  void loadReaderQuality(force).then((q) => (quality.value = q))
  void api.dataops.originMap().then((m) => (places.value = m), () => (places.value = null))
  try {
    data.value = await api.dataops.flow()
  } catch (e) {
    error.value = describeFailure(e, 'De datastroom kon niet worden geteld.')
  } finally {
    loading.value = false
  }
}
onBeforeMount(() => load())

const graph = computed(() => (data.value ? buildFlow(data.value) : null))
const rows = computed(() => (data.value ? sourceRows(data.value) : []))

const nl = (n: number) => n.toLocaleString('nl-NL')
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—')

const DOT: Record<FlowGroup, string> = { done: 'bg-green-ink', closed: 'bg-label', open: 'bg-amber-ink' }
const BAR: Record<FlowGroup, string> = { done: 'bg-green-ink', closed: 'bg-label', open: 'bg-amber-ink' }

const tiles = computed(() =>
  GROUPS.map(({ group, label }) => {
    const node = graph.value?.nodes.find((n) => n.id === `group:${group}`)
    const value = node?.value ?? 0
    return {
      group,
      label,
      value: nl(value),
      share: graph.value ? pct(value, graph.value.total) : '',
      link: node?.link ?? { name: 'review-queue' },
    }
  }),
)

const updated = computed(() =>
  data.value
    ? new Date(data.value.generatedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    : null,
)

/** The first and last week the sparklines cover, for their column head. */
const span = computed(() => {
  const w = data.value?.weeks
  if (!w?.length) return ''
  const d = (iso: string) => new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  return `${d(w[0])} – nu`
})

const sourceView = (channel: string) => SOURCES.find((s) => s.channel === channel)?.view ?? 'alles'
const lastFour = (values: number[]) => values.slice(-4).reduce((a, b) => a + b, 0)

/** New to old, light to dark: one amber ramp, so older reads as more urgent at a glance. */
const AGE_BG = ['bg-amber-spark', 'bg-amber-field', 'bg-amber', 'bg-amber-ink', 'bg-[#6e4806]']
const days = (d: number | null) =>
  d == null ? '—' : d < 1 ? '< 1 d' : `${d.toLocaleString('nl-NL', { maximumFractionDigits: d < 10 ? 1 : 0 })} d`
function waitingTitle(row: SourceRow) {
  if (!row.waiting) return ''
  const bands = row.waiting.bands
    .map((n, i) => (n ? `${nl(n)} ${AGE_BANDS[i]}` : null))
    .filter(Boolean)
    .join(', ')
  return `${nl(row.open)} open, wachten mediaan ${days(row.waiting.medianDays)}: ${bands}.`
}
</script>

<template>
  <AppShell crumb="Datastroom">
    <!-- Compact (2026-10-22, "way too big"): the picture and the table per source
         in the first screen at 1528×900; the reader's record under it. -->
    <div class="flex flex-col gap-3 px-6 pt-3 pb-4">
      <PageHeader
        kicker="Inzicht"
        title="Datastroom"
        purpose="Waar alles wat binnenkwam terechtkwam: van de bron, via de controle, tot in FunderMaps. Elke band is zo dik als het aantal dossiers dat hij draagt."
        :meta="updated ? `geteld om ${updated}` : undefined"
      >
        <template #actions><Button label="Opnieuw tellen" :disabled="loading" @click="load(true)" /></template>
      </PageHeader>

      <p v-if="error" class="text-md rounded-xl border border-red bg-red-tint px-4 py-3 text-red">{{ error }}</p>

      <Panel title="Van bron tot uitkomst" :meta="graph ? `${nl(graph.total)} dossiers` : undefined">
        <!-- The three outcomes, as the tiles had them, in the header: the tiles
             said again what the middle column of the picture says. -->
        <template v-if="graph" #actions>
          <RouterLink
            v-for="tile in tiles"
            :key="tile.group"
            :to="tile.link"
            class="text-md flex items-baseline gap-1.5 rounded-md px-2 py-0.5 hover:bg-sunken"
          >
            <span aria-hidden="true" class="h-2 w-2 self-center rounded-full" :class="DOT[tile.group]" />
            <span class="text-muted">{{ tile.label }}</span>
            <span class="font-mono font-semibold tabular-nums text-ink">{{ tile.value }}</span>
            <span class="text-sm font-mono text-faint">{{ tile.share }}</span>
          </RouterLink>
        </template>
        <FlowDiagram v-if="data" :data="data" />
        <div v-else-if="loading" class="h-[300px] animate-pulse rounded-xl bg-sunken" aria-label="Laden" />
      </Panel>

      <Panel title="Per bron" flush>
        <div role="table" aria-label="Per bron" class="text-md">
          <div
            role="row"
            class="grid grid-cols-[minmax(130px,1fr)_180px_repeat(4,82px)_120px_160px_160px] items-center gap-3 border-b border-divider bg-raised px-4 py-2 text-xs font-bold tracking-[0.06em] text-label uppercase"
          >
            <span role="columnheader">Bron</span>
            <span role="columnheader">Waar het heen ging</span>
            <span role="columnheader" class="text-right">In FunderMaps</span>
            <span role="columnheader" class="text-right">Gesloten</span>
            <span role="columnheader" class="text-right">Open</span>
            <span role="columnheader" class="text-right">Totaal</span>
            <span role="columnheader" title="Hoe lang de open dossiers al wachten: de mediaan, en de verdeling van nieuw (licht) naar oud (donker)">Wacht</span>
            <span role="columnheader">Binnen per week</span>
            <span role="columnheader">Gesloten per week</span>
          </div>
          <div
            v-for="row in rows"
            :key="row.channel"
            role="row"
            class="grid grid-cols-[minmax(130px,1fr)_180px_repeat(4,82px)_120px_160px_160px] items-center gap-3 border-b border-divider px-4 py-1.5 last:border-b-0"
          >
            <RouterLink
              role="cell"
              :to="{ name: 'review-queue', query: { view: sourceView(row.channel), channel: row.channel } }"
              class="text-lg font-semibold text-body hover:underline"
            >
              {{ row.label }}
            </RouterLink>
            <!-- The split in one bar, each part with a 2px gap; the numbers stand beside it. -->
            <span role="cell" class="flex h-2.5 gap-[2px] overflow-hidden rounded-full" :aria-label="`${pct(row.done, row.total)} in FunderMaps, ${pct(row.closed, row.total)} gesloten, ${pct(row.open, row.total)} open`">
              <span
                v-for="g in (['done', 'closed', 'open'] as FlowGroup[])"
                v-show="row[g] > 0"
                :key="g"
                :class="BAR[g]"
                :style="{ flexGrow: row[g], flexBasis: 0, minWidth: '3px' }"
              />
            </span>
            <span role="cell" class="text-right font-mono tabular-nums text-strong">
              {{ nl(row.done) }} <span class="text-faint">{{ pct(row.done, row.total) }}</span>
            </span>
            <span role="cell" class="text-right font-mono tabular-nums text-muted">{{ nl(row.closed) }}</span>
            <span role="cell" class="text-right font-mono tabular-nums text-muted">{{ nl(row.open) }}</span>
            <span role="cell" class="text-right font-mono tabular-nums text-strong">{{ nl(row.total) }}</span>
            <!-- How long its open dossiers have waited (2026-10-22): the median, and the age
                 bands as one bar, new (light) to old (dark). Empty without the API's answer. -->
            <span
              role="cell"
              class="flex flex-col gap-1"
              :title="row.waiting ? waitingTitle(row) : undefined"
            >
              <template v-if="row.waiting && row.open">
                <span class="text-sm font-mono tabular-nums text-strong">
                  {{ days(row.waiting.medianDays) }} <span class="text-faint">mediaan</span>
                </span>
                <span class="flex h-1.5 w-full gap-px overflow-hidden rounded-full" aria-hidden="true">
                  <template v-for="(n, i) in row.waiting.bands" :key="i">
                    <span v-if="n" :class="AGE_BG[i]" :style="{ flexGrow: n, flexBasis: 0, minWidth: '3px' }" />
                  </template>
                </span>
              </template>
              <span v-else class="text-sm text-faint">—</span>
            </span>
            <span role="cell" class="flex items-end gap-2" :title="`Per week, ${span}: ${row.received.join(' · ')}`">
              <Sparkline :values="row.received" tone="blue" />
              <span class="text-xs font-mono whitespace-nowrap text-faint">{{ nl(lastFour(row.received)) }} in 4 wk</span>
            </span>
            <span role="cell" class="flex items-end gap-2" :title="`Per week, ${span}: ${row.closedPerWeek.join(' · ')}`">
              <Sparkline :values="row.closedPerWeek" tone="green" />
              <span class="text-xs font-mono whitespace-nowrap text-faint">{{ nl(lastFour(row.closedPerWeek)) }} in 4 wk</span>
            </span>
          </div>
          <p v-if="!rows.length && !loading" class="px-4 py-6 text-muted">Nog niets binnengekomen.</p>
        </div>
      </Panel>

      <!-- What the reader gets right, per field, and where the dossiers come from (2026-10-22):
           side by side, so the page grows by one panel's height, not two. -->
      <div v-if="quality || places" class="grid grid-cols-2 items-start gap-3">
        <ReaderQualityPanel v-if="quality" :quality="quality" />
        <Panel v-if="places" title="Waar het vandaan komt" :meta="`${places.municipalities.length} gemeenten`">
          <div class="flex flex-col gap-2">
            <div class="h-[440px] overflow-hidden rounded-xl border border-line">
              <OriginMap :data="places" />
            </div>
            <p class="text-sm text-muted">
              Meeste dossiers:
              <template v-for="(m, i) in places.municipalities.slice(0, 5)" :key="m.code">
                <span v-if="i" class="text-faint"> · </span>{{ m.name }} <span class="font-mono text-faint">{{ nl(m.dossiers) }}</span>
              </template>
            </p>
            <p v-if="places.unplaced" class="text-sm text-faint">
              {{ nl(places.unplaced) }} van de {{ nl(places.total) }} dossiers hebben nog geen pand en staan niet op de kaart.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  </AppShell>
</template>
