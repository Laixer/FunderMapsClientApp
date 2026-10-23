<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import Panel from '@/components/Common/Panel.vue'
import Sparkline from '@/components/Common/Sparkline.vue'
import api from '@/services/fundermaps'
import type { ITeam } from '@/services/fundermaps/interfaces/IDataops'

/**
 * Het team (2026-10-23): who did what in the last 30 days — the per-person
 * panels of Grafana's "Operations" board. For administrators only, decided in
 * the terminal ("keep per-person admin only"): Vandaag renders this panel for
 * them alone, and the API answers anyone else with a 403.
 *
 * Rapportages and samples are those created under someone's name, which
 * includes what they took over in Controle. What the system closed itself
 * (duplicates, nothing found) is one line under the table, not a person.
 */
const data = ref<ITeam | null>(null)
const failed = ref(false)
onMounted(async () => {
  try {
    data.value = await api.dataops.team()
  } catch {
    failed.value = true
  }
})

const nl = (n: number) => n.toLocaleString('nl-NL')
const COLUMNS: DataColumn[] = [
  { field: 'person', title: 'Wie', width: 'minmax(0,1fr)' },
  { field: 'activeDays', title: 'Actieve dagen', width: '120px', align: 'right' },
  { field: 'rapportages', title: 'Rapportages', width: '110px', align: 'right' },
  { field: 'samples', title: 'Monsters', width: '100px', align: 'right' },
  { field: 'verdicts', title: 'Waarden beoordeeld', width: '160px', align: 'right' },
  { field: 'closed', title: 'Dossiers afgesloten', width: '160px', align: 'right' },
  { field: 'perDay', title: 'Per dag', width: '260px' },
]
const rows = computed(() => (data.value?.team ?? []).map((p, i) => ({ id: i, ...p })))
</script>

<template>
  <Panel v-if="data || failed" title="Het team" meta="laatste 30 dagen · alleen voor beheerders" flush>
    <DataTable
      :rows="rows"
      :columns="COLUMNS"
      label="Het team, laatste 30 dagen"
      :empty-message="failed ? 'Het team kon niet worden opgehaald.' : 'Niemand deed iets in deze dagen.'"
    >
      <template #person="{ row }"><span class="text-md truncate text-ink">{{ row.person }}</span></template>
      <template #activeDays="{ row }"><span class="font-mono tabular-nums text-strong">{{ row.activeDays }}</span></template>
      <template #rapportages="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.rapportages) }}</span></template>
      <template #samples="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.samples) }}</span></template>
      <template #verdicts="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.verdicts) }}</span></template>
      <template #closed="{ row }"><span class="font-mono tabular-nums text-muted">{{ nl(row.closed) }}</span></template>
      <template #perDay="{ row }">
        <span :title="`Per dag, laatste 30 dagen: ${row.perDay.join(' · ')}`"><Sparkline :values="row.perDay" tone="blue" /></span>
      </template>
    </DataTable>
    <p v-if="data" class="text-sm border-t border-divider px-4 py-2.5 text-muted">
      Rapportages en monsters op iemands naam, ook wat in Controle is overgenomen. Het systeem sloot zelf
      {{ nl(data.systemClosed) }} dossiers af (dubbel of niets gevonden).
    </p>
  </Panel>
</template>
