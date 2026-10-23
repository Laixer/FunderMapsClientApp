<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import Panel from '@/components/Common/Panel.vue'
import Sparkline from '@/components/Common/Sparkline.vue'
import api from '@/services/fundermaps'
import type { IQueueTrend } from '@/services/fundermaps/interfaces/IDataops'
import { WORK_PACKAGES, hasTrend, loadTrend, packageLink } from '@/services/workPackages'

/**
 * Every work package over its last 30 days (2026-10-23): what is open now, how
 * that went this month, the oldest, how many wait longer than a week, how many
 * were handled. Where work piles up and where it moves, for everyone — the
 * Grafana board "Operations" ("Werkpakketten nu", "Open per pakket",
 * "Afgehandeld per pakket per dag"), moved onto Vandaag.
 *
 * The numbers come from the queue's own filters (API /queue/trend), so a row
 * here and the package's count above can never disagree. A package that filters
 * on how a dossier stands now has no history; it gets its count and a dash,
 * with the reason on hover, not a line drawn from today.
 */
const router = useRouter()
const nl = (n: number) => n.toLocaleString('nl-NL')

const trends = ref<Record<string, IQueueTrend | null>>({})
/** The count for a package without history; `null` = did not come back. */
const counts = ref<Record<string, number | null>>({})
const loaded = ref(false)

onMounted(async () => {
  const results = await Promise.all(
    WORK_PACKAGES.map(async (p) => {
      const [trend, count] = await Promise.all([
        loadTrend(p),
        hasTrend(p) ? Promise.resolve(null) : api.dataops.queueCount(p.opts).then((r) => r.count as number | null, () => null),
      ])
      return [p.id, trend, count] as const
    }),
  )
  trends.value = Object.fromEntries(results.map(([id, trend]) => [id, trend]))
  counts.value = Object.fromEntries(results.map(([id, , count]) => [id, count]))
  loaded.value = true
})

const NO_HISTORY = 'Geen verloop: dit pakket kijkt naar hoe een dossier er nú voor staat.'

const rows = computed(() =>
  WORK_PACKAGES.map((p) => {
    const t = trends.value[p.id] ?? null
    const open = t ? t.now.open : (counts.value[p.id] ?? null)
    return {
      id: p.id,
      title: p.title,
      link: packageLink(p),
      history: hasTrend(p),
      open,
      series: t?.open ?? null,
      was: t?.open[0] ?? null,
      oldestDays: t?.now.oldestDays ?? null,
      overWeek: t?.now.overWeek ?? null,
      handled: t ? t.handled.reduce((n, x) => n + x, 0) : null,
    }
  }).sort((a, b) => (b.open ?? -1) - (a.open ?? -1) || a.title.localeCompare(b.title)),
)
const openTotal = computed(() => rows.value.reduce((n, r) => n + (r.open ?? 0), 0))

const COLUMNS: DataColumn[] = [
  { field: 'title', title: 'Pakket', width: 'minmax(0,1fr)' },
  { field: 'open', title: 'Open', width: '80px', align: 'right' },
  // 30 bars are ~240px; the rest is "was 1.334", which is the point of the column.
  { field: 'series', title: 'Laatste 30 dagen', width: '340px' },
  { field: 'oldestDays', title: 'Oudste', width: '90px', align: 'right' },
  { field: 'overWeek', title: 'Ouder dan een week', width: '150px', align: 'right' },
  { field: 'handled', title: 'Afgehandeld', width: '110px', align: 'right' },
]
</script>

<template>
  <Panel title="Alle werkpakketten" :meta="loaded ? `${nl(openTotal)} open · laatste 30 dagen` : undefined" flush>
    <DataTable
      :rows="loaded ? rows : []"
      :columns="COLUMNS"
      label="Alle werkpakketten"
      :empty-message="loaded ? 'Geen werkpakketten.' : 'Laden…'"
      @select="(row) => router.push(row.link)"
    >
      <template #title="{ row }"><span class="text-md truncate text-ink">{{ row.title }}</span></template>
      <template #open="{ row }">
        <span class="font-mono tabular-nums text-strong">{{ row.open == null ? '—' : nl(row.open) }}</span>
      </template>
      <template #series="{ row }">
        <span v-if="!row.history" class="text-sm text-faint" :title="NO_HISTORY">geen verloop</span>
        <span
          v-else-if="row.series && row.series.some((x: number) => x > 0)"
          class="flex items-center gap-2"
          :title="`Open aan het eind van de dag: ${row.series.join(' · ')}`"
        >
          <Sparkline :values="row.series" tone="green" />
          <span class="text-xs font-mono whitespace-nowrap text-faint">was {{ nl(row.was ?? 0) }}</span>
        </span>
        <span v-else-if="row.series" class="text-sm text-faint">de hele maand leeg</span>
        <span v-else class="text-sm text-faint">—</span>
      </template>
      <template #oldestDays="{ row }">
        <span class="font-mono tabular-nums text-muted">{{ row.oldestDays == null ? '—' : `${row.oldestDays} d` }}</span>
      </template>
      <template #overWeek="{ row }">
        <span class="font-mono tabular-nums" :class="row.overWeek ? 'text-amber-ink' : 'text-muted'">
          {{ row.overWeek == null ? '—' : nl(row.overWeek) }}
        </span>
      </template>
      <template #handled="{ row }">
        <span class="font-mono tabular-nums text-muted">{{ row.handled == null ? '—' : nl(row.handled) }}</span>
      </template>
    </DataTable>
  </Panel>
</template>
