<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import Pill from '@/components/Common/Pill.vue'
import api from '@/services/fundermaps'
import type { IReviewQueueItem } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'

/**
 * The review queue.
 *
 * Everything here was read by the pipeline and is waiting for a person. It is a
 * waiting line rather than a feed: a terugmelding carries a 24–48 hour promise
 * to whoever sent it, so the oldest submission is always the one at the top.
 */
const router = useRouter()
const rows = ref<IReviewQueueItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onBeforeMount(async () => {
  try {
    rows.value = await api.dataops.queue()
  } catch (e) {
    error.value = describeFailure(e, 'De controlelijst kon niet worden geladen.')
  } finally {
    loading.value = false
  }
})

const columns: DataColumn[] = [
  { field: 'externalRef', title: 'Kenmerk', width: '150px' },
  { field: 'subject', title: 'Document', width: 'minmax(280px,1fr)' },
  { field: 'channel', title: 'Binnengekomen via', width: '150px' },
  { field: 'open', title: 'Voorstellen', width: '110px', align: 'right' },
  { field: 'receivedAt', title: 'Ontvangen', width: '150px' },
]

const items = computed(() =>
  rows.value.map((r) => ({
    ...r,
    id: r.id,
    externalRef: r.externalRef ?? '—',
    subject: r.subject ?? 'Zonder omschrijving',
    receivedAtIso: r.receivedAt,
    receivedAt: new Date(r.receivedAt).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  })),
)

/** Anything older than a week has broken the promise we made to the melder. */
function overdue(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() > 7 * 24 * 3600 * 1000
}

function open(row: { id: number }) {
  router.push({ name: 'review-dossier', params: { id: row.id } })
}
</script>

<template>
  <AppShell crumb="Controle">
    <div class="flex flex-col gap-4">
      <header class="flex items-baseline justify-between">
        <div>
          <h1 class="text-xl font-semibold">Controle</h1>
          <p class="text-md text-muted">
            Documenten die de pipeline heeft gelezen. Niets hiervan staat in FunderMaps
            tot u het overneemt.
          </p>
        </div>
        <span v-if="!loading" class="font-mono text-md text-muted tabular-nums">
          {{ rows.length }} open
        </span>
      </header>

      <EmptyState v-if="error" dashed>{{ error }}</EmptyState>
      <EmptyState v-else-if="loading" dashed>Bezig met laden…</EmptyState>
      <EmptyState v-else-if="rows.length === 0" dashed>
        Niets te controleren. Alles wat binnenkwam is beoordeeld.
      </EmptyState>

      <DataTable
        v-else
        :rows="items"
        :columns="columns"
        @select="open"
      >
        <template #open="{ row }">
          <span class="font-mono tabular-nums">{{ row.open }}</span>
        </template>
        <template #receivedAt="{ row }">
          <span class="flex items-center gap-2">
            {{ row.receivedAt }}
            <Pill v-if="overdue(row.receivedAtIso)" label="te lang open" tone="amber" plain />
          </span>
        </template>
      </DataTable>
    </div>
  </AppShell>
</template>
