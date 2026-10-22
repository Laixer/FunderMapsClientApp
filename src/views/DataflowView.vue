<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import FlowDiagram from '@/components/Flow/FlowDiagram.vue'
import KpiTile from '@/components/Common/KpiTile.vue'
import Panel from '@/components/Common/Panel.vue'
import Sparkline from '@/components/Common/Sparkline.vue'

import api from '@/services/fundermaps'
import type { IDataopsFlow } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { buildFlow, GROUPS, SOURCES, sourceRows, type FlowGroup } from '@/services/dataflow'
import type { Tone } from '@/services/tone'

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
const router = useRouter()

const data = ref<IDataopsFlow | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.dataops.flow()
  } catch (e) {
    error.value = describeFailure(e, 'De datastroom kon niet worden geteld.')
  } finally {
    loading.value = false
  }
}
onBeforeMount(load)

const graph = computed(() => (data.value ? buildFlow(data.value) : null))
const rows = computed(() => (data.value ? sourceRows(data.value) : []))

const nl = (n: number) => n.toLocaleString('nl-NL')
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—')

const TONE: Record<FlowGroup, Tone> = { done: 'green', closed: 'neutral', open: 'amber' }
const BAR: Record<FlowGroup, string> = { done: 'bg-green-ink', closed: 'bg-label', open: 'bg-amber-ink' }

const tiles = computed(() =>
  GROUPS.map(({ group, label }) => {
    const node = graph.value?.nodes.find((n) => n.id === `group:${group}`)
    const value = node?.value ?? 0
    return {
      group,
      label,
      value: nl(value),
      caption: graph.value ? `${pct(value, graph.value.total)} van ${nl(graph.value.total)}` : null,
      tone: TONE[group],
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
</script>

<template>
  <AppShell crumb="Datastroom">
    <div class="flex flex-col gap-4.5 px-6 py-6">
      <header class="flex items-end gap-4">
        <div class="flex-1">
          <h1 class="text-5xl font-display font-bold text-ink">Datastroom</h1>
          <p class="text-xl mt-1 text-muted">
            Waar alles wat binnenkwam terechtkwam: van de bron, via de controle, tot in FunderMaps.
          </p>
        </div>
        <span v-if="updated" class="text-sm pb-1 font-mono text-faint">geteld om {{ updated }}</span>
        <Button label="Opnieuw tellen" :disabled="loading" @click="load" />
      </header>

      <p v-if="error" class="text-md rounded-xl border border-red bg-red-tint px-4 py-3 text-red">{{ error }}</p>

      <div class="grid grid-cols-3 gap-3">
        <KpiTile
          v-for="tile in tiles"
          :key="tile.group"
          :label="tile.label"
          :value="tile.value"
          :caption="tile.caption"
          :tone="tile.tone"
          :loading="loading && !data"
          @click="router.push(tile.link)"
        />
      </div>

      <Panel title="Van bron tot uitkomst" :meta="graph ? `${nl(graph.total)} dossiers` : undefined">
        <template #actions>
          <span class="text-sm text-faint">Elke band is zo dik als het aantal dossiers dat hij draagt.</span>
        </template>
        <FlowDiagram v-if="data" :data="data" />
        <div v-else-if="loading" class="h-[460px] animate-pulse rounded-xl bg-sunken" aria-label="Laden" />
      </Panel>

      <Panel title="Per bron" flush>
        <div role="table" class="text-md">
          <div
            role="row"
            class="grid grid-cols-[minmax(140px,1fr)_200px_repeat(4,90px)_180px_180px] items-center gap-4 border-b border-divider bg-raised px-4 py-2 text-xs font-bold tracking-[0.06em] text-label uppercase"
          >
            <span role="columnheader">Bron</span>
            <span role="columnheader">Waar het heen ging</span>
            <span role="columnheader" class="text-right">In FunderMaps</span>
            <span role="columnheader" class="text-right">Gesloten</span>
            <span role="columnheader" class="text-right">Open</span>
            <span role="columnheader" class="text-right">Totaal</span>
            <span role="columnheader">Binnen per week</span>
            <span role="columnheader">Gesloten per week</span>
          </div>
          <div
            v-for="row in rows"
            :key="row.channel"
            role="row"
            class="grid grid-cols-[minmax(140px,1fr)_200px_repeat(4,90px)_180px_180px] items-center gap-4 border-b border-divider px-4 py-2.5 last:border-b-0"
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
    </div>
  </AppShell>
</template>
