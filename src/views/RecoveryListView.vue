<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import KeyValueList, { type KeyValueItem } from '@/components/Common/KeyValueList.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'

import api from '@/services/fundermaps'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import { describeFailure } from '@/services/fundermaps/errors'
import { recoveryDocumentTypeLabel } from '@/services/recoveryEnums'
import { toastError } from '@/services/toast'
import { formatDateShort } from '@/utils/date'
import { useRowKeyboard } from '@/services/useRowKeyboard'

/**
 * Herstel — the same explorer shape as Rapportages, minus what the API cannot
 * do.
 *
 * `GET /recovery` takes `q`, `limit` and `offset` and nothing else: no status
 * filter, no attribution filter, no sort. So there are no saved views and no
 * filter chips here — not because a repair dossier deserves less, but because
 * offering controls that quietly do nothing is worse than not offering them.
 * With 14 recoveries in production against 26k inquiries, search and the
 * inspector are the whole job.
 */
const router = useRouter()

/** Same page as the explorer — see `PAGE_SIZE` in `services/explorer.ts`. */
const PAGE_SIZE = 20

const rows: Ref<IRecovery[]> = ref([])
const loading = ref(true)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const page = ref(1)

const hasMore = computed(() => rows.value.length === PAGE_SIZE)

async function load() {
  try {
    loading.value = true
    const q = search.value.trim()
    rows.value = await api.recovery.list({
      ...(q ? { q } : {}),
      limit: PAGE_SIZE,
      offset: (page.value - 1) * PAGE_SIZE,
    })
  } catch (e) {
    toastError(describeFailure(e, 'De herstel-dossiers konden niet worden opgehaald.'))
    rows.value = []
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

watch(debouncedSearch, () => {
  page.value = 1
  load()
})
watch(page, load)

const COLUMNS: DataColumn[] = [
  { field: 'id', title: 'ID', width: '84px' },
  { field: 'documentName', title: 'Naam', width: 'minmax(260px,1fr)' },
  { field: 'type', title: 'Documenttype', width: '160px' },
  { field: 'documentDate', title: 'Datum', width: '92px' },
  { field: 'reviewer', title: 'Beoordelaar', width: '150px' },
  { field: 'status', title: 'Status', width: '128px' },
]

const selected = ref<IRecovery | null>(null)

const inspectorFields = computed<KeyValueItem[]>(() => {
  const row = selected.value
  if (!row) return []
  return [
    { label: 'Documenttype', value: recoveryDocumentTypeLabel(row.type) },
    { label: 'Uitvoerder', value: row.attribution.contractorName },
    { label: 'Opsteller', value: row.attribution.creatorName },
    { label: 'Beoordelaar', value: row.attribution.reviewerName },
    { label: 'Data-eigenaar', value: row.attribution.dataOwnerName },
    { label: 'Documentdatum', value: formatDateShort(row.documentDate), mono: true },
    ...(row.note ? [{ label: 'Notitie', value: row.note }] : []),
  ]
})

const { activeId } = useRowKeyboard({
  rows,
  onOpen: (row) => router.push({ name: 'recovery-view', params: { id: row.id } }),
})

watch(activeId, (id) => {
  const row = rows.value.find((r) => r.id === id)
  if (row) selected.value = row
})
</script>

<template>
  <AppShell crumb="Herstel" fill>
    <div class="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
      <div
        class="flex max-w-[340px] flex-1 items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-1.5"
      >
        <span aria-hidden="true" class="text-md text-faint">⌕</span>
        <input
          v-model="search"
          type="search"
          class="studio-control"
          placeholder="Filter op naam, ID of pand-ID"
          aria-label="Zoeken in herstel-dossiers"
        />
      </div>

      <div class="ml-auto flex items-center gap-2">
        <span class="text-sm font-mono text-faint">
          {{ rows.length }}{{ hasMore ? '+' : '' }} rijen
        </span>
        <Button
          variant="primary"
          label="Nieuw herstel"
          @click="router.push({ name: 'recovery-new' })"
        />
      </div>
    </div>

    <div
      class="grid min-h-0 flex-1 grid-cols-[minmax(var(--spacing-table-min),1fr)_var(--spacing-inspector)]"
    >
      <div class="min-w-0 overflow-auto bg-surface">
        <DataTable
          :rows="rows"
          :columns="COLUMNS"
          :loading="loading"
          :active-id="selected?.id ?? null"
          :empty-message="
            search ? `Niets gevonden voor “${search}”.` : 'Geen herstel-dossiers gevonden.'
          "
          @select="selected = $event"
        >
          <template #id="{ row }">
            <span class="text-sm font-mono text-faint">#{{ row.id }}</span>
          </template>
          <template #documentName="{ row }">
            <span class="text-lg font-semibold text-body">{{ row.documentName }}</span>
          </template>
          <template #type="{ row }">
            <span class="text-base text-muted">{{ recoveryDocumentTypeLabel(row.type) }}</span>
          </template>
          <template #documentDate="{ row }">
            <span class="text-sm font-mono text-muted">{{ formatDateShort(row.documentDate) }}</span>
          </template>
          <template #reviewer="{ row }">
            <span class="text-base text-muted">{{ row.attribution?.reviewerName ?? '—' }}</span>
          </template>
          <template #status="{ row }">
            <StatusBadge :status="row.state?.auditStatus" />
          </template>

          <template #footer>
            <span class="text-base text-subtle">
              Pagina {{ page }} · {{ rows.length }} op deze pagina
            </span>
            <span class="ml-auto flex gap-1.5">
              <Button label="Vorige" :disabled="page <= 1" @click="page -= 1" />
              <Button label="Volgende" :disabled="!hasMore" @click="page += 1" />
            </span>
          </template>
        </DataTable>
      </div>

      <aside class="flex min-h-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <div v-if="selected" class="flex flex-col gap-4 p-4">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-mono text-faint">#{{ selected.id }}</span>
            <h2 class="text-3xl font-display font-bold break-words text-ink">
              {{ selected.documentName }}
            </h2>
            <StatusBadge class="mt-1.5 self-start" :status="selected.state?.auditStatus" />
          </div>

          <div class="flex gap-2">
            <Button
              variant="primary"
              label="Dossier openen"
              block
              @click="router.push({ name: 'recovery-view', params: { id: selected.id } })"
            />
            <Button
              label="Invoer"
              @click="router.push({ name: 'recovery-edit-2', params: { id: selected.id } })"
            />
          </div>

          <div>
            <h3 class="studio-label mb-1.5">VELDEN</h3>
            <KeyValueList :items="inspectorFields" ratio="46%" />
          </div>
        </div>

        <p v-else class="text-md p-6 text-muted">
          Kies een rij om het dossier hier te bekijken. Enter opent het volledig.
        </p>
      </aside>
    </div>
  </AppShell>
</template>
