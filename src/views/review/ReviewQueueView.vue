<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import Pill from '@/components/Common/Pill.vue'
import api from '@/services/fundermaps'
import type { IReviewQueueItem } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'

/**
 * The review queue.
 *
 * Everything here was read by the pipeline and is waiting for a person. It is a
 * waiting line rather than a feed: a terugmelding carries a 24–48 hour promise
 * to whoever sent it, so the oldest submission is always at the top and
 * anything past a week says so.
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

const COLUMNS: DataColumn[] = [
  { field: 'externalRef', title: 'Kenmerk', width: '150px' },
  { field: 'subject', title: 'Document', width: 'minmax(280px,1fr)' },
  { field: 'channel', title: 'Via', width: '120px' },
  { field: 'open', title: 'Voorstellen', width: '110px', align: 'right' },
  { field: 'receivedAt', title: 'Ontvangen', width: '170px' },
]

const WEEK = 7 * 24 * 3600 * 1000

const items = computed(() =>
  rows.value.map((r) => ({
    id: r.id,
    externalRef: r.externalRef ?? '—',
    subject: r.subject ?? 'Zonder omschrijving',
    channel: r.channel,
    open: r.open,
    receivedAt: new Date(r.receivedAt).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    overdue: Date.now() - new Date(r.receivedAt).getTime() > WEEK,
  })),
)

function open(row: { id: number }) {
  router.push({ name: 'review-dossier', params: { id: row.id } })
}
</script>

<template>
  <AppShell crumb="Controle" fill>
    <div class="flex shrink-0 items-baseline gap-3 border-b border-line bg-surface px-6 py-3">
      <h1 class="text-lg font-bold text-ink">Controle</h1>
      <p class="text-md flex-1 text-muted">
        Documenten die de pipeline heeft gelezen. Niets hiervan staat in FunderMaps tot
        u het overneemt.
      </p>
      <span v-if="!loading" class="text-md font-mono tabular-nums text-faint">
        {{ rows.length }} open
      </span>
    </div>

    <div
      v-if="error"
      class="text-md shrink-0 border-b border-red bg-red-tint px-6 py-2.5 text-red"
    >
      {{ error }}
    </div>

    <div class="min-h-0 flex-1 overflow-auto bg-surface">
      <DataTable
        :rows="items"
        :columns="COLUMNS"
        :loading="loading"
        empty-message="Niets te controleren. Alles wat binnenkwam is beoordeeld."
        @select="open"
      >
        <template #externalRef="{ row }">
          <span class="text-sm font-mono text-faint">{{ row.externalRef }}</span>
        </template>
        <template #subject="{ row }">
          <span class="text-lg font-semibold text-body">{{ row.subject }}</span>
        </template>
        <template #open="{ row }">
          <span class="font-mono tabular-nums text-strong">{{ row.open }}</span>
        </template>
        <template #receivedAt="{ row }">
          <span class="flex items-center gap-2">
            <span class="text-muted">{{ row.receivedAt }}</span>
            <Pill v-if="row.overdue" label="te lang open" tone="amber" plain />
          </span>
        </template>
      </DataTable>
    </div>
  </AppShell>
</template>
