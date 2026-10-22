<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import PageHeader from '@/components/Common/PageHeader.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import KeyValueList, { type KeyValueItem } from '@/components/Common/KeyValueList.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'

import api from '@/services/fundermaps'
import { canEdit } from '@/services/pipeline'
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
const route = useRoute()

/** Same page as the explorer — see `PAGE_SIZE` in `services/explorer.ts`. */
const PAGE_SIZE = 20

/**
 * The search text and the page live in the address, as on Rapportages: a
 * reload on page 2 came back on page 1, and Back from a dossier returned to an
 * emptied search.
 */
const queryText = (value: unknown) => (typeof value === 'string' ? value : '')
const queryPage = (value: unknown) => {
  const n = Number.parseInt(queryText(value), 10)
  return Number.isInteger(n) && n > 0 ? n : 1
}

const rows: Ref<IRecovery[]> = ref([])
const loading = ref(true)
/** The list did not load: the table says so, and there is nothing to count. */
const loadFailed = ref(false)
const search = ref(queryText(route.query.q))
const debouncedSearch = refDebounced(search, 300)
const page = ref(queryPage(route.query.page))

/** Written into the entry that is open (replace): typing is not a step to go Back through. */
function syncAddress() {
  const q = search.value.trim()
  router.replace({
    name: 'recovery-list',
    query: { ...(q ? { q } : {}), ...(page.value > 1 ? { page: String(page.value) } : {}) },
  })
}

const hasMore = computed(() => rows.value.length === PAGE_SIZE)

async function load() {
  try {
    loading.value = true
    loadFailed.value = false
    const q = search.value.trim().replace(/^#/, '')
    rows.value = await api.recovery.list({
      ...(q ? { q } : {}),
      limit: PAGE_SIZE,
      offset: (page.value - 1) * PAGE_SIZE,
    })
  } catch (e) {
    toastError(describeFailure(e, 'De herstel-dossiers konden niet worden opgehaald.'))
    loadFailed.value = true
    rows.value = []
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

watch(debouncedSearch, (text, previous) => {
  // A new search starts on its first page (the page watcher below then loads it);
  // the page that came with the address stays.
  if (text.trim() !== previous.trim() && page.value !== 1) {
    page.value = 1
    return
  }
  syncAddress()
  load()
})
watch(page, () => {
  syncAddress()
  load()
})

// The address changed from outside (the sidebar's "Herstel", Back/Forward): follow it.
watch(
  () => [route.query.q, route.query.page],
  ([q, p]) => {
    if (route.name !== 'recovery-list') return
    if (queryText(q) !== search.value.trim()) search.value = queryText(q)
    if (queryPage(p) !== page.value) page.value = queryPage(p)
  },
)

const COLUMNS: DataColumn[] = [
  { field: 'id', title: 'ID', width: '84px' },
  // Status 140px for its longest pill; the 12px come off Documenttype, whose longest label fits in 148px.
  { field: 'documentName', title: 'Naam', width: 'minmax(260px,1fr)' },
  { field: 'type', title: 'Documenttype', width: '148px' },
  { field: 'documentDate', title: 'Datum', width: '92px' },
  { field: 'reviewer', title: 'Beoordelaar', width: '150px' },
  { field: 'status', title: 'Status', width: '140px' },
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

const { activeId, setActive } = useRowKeyboard({
  rows,
  onOpen: (row) => router.push({ name: 'recovery-view', params: { id: row.id } }),
})

watch(activeId, (id) => {
  const row = rows.value.find((r) => r.id === id)
  if (row) selected.value = row
})

/** A click on a row: show it in the pane, and let Enter and j/k carry on from it. */
function select(row: IRecovery) {
  selected.value = row
  setActive(row.id)
}
</script>

<template>
  <AppShell crumb="Herstel" fill>
    <div class="flex shrink-0 border-b border-line bg-surface px-6 py-3">
      <PageHeader
        compact
        class="w-full"
        kicker="Gegevens"
        title="Herstel"
        purpose="Funderingsherstel per pand: vergunningen, herstelrapporten en bewijs van eigenaren."
      />
    </div>
    <div class="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
      <div
        class="flex max-w-[340px] flex-1 items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-1.5 focus-within:border-green focus-within:ring-2 focus-within:ring-green/30"
      >
        <span aria-hidden="true" class="text-md text-faint">⌕</span>
        <input
          v-model="search"
          type="search"
          class="studio-control"
          placeholder="Filter op naam, nummer of pand-ID"
          aria-label="Zoeken in herstel-dossiers"
        />
      </div>

      <div class="ml-auto flex items-center gap-2">
        <!-- Not while loading or after a failed load: "0 rijen" stood there both times. -->
        <span v-if="!loading && !loadFailed" class="text-sm font-mono text-faint">
          {{ rows.length }}{{ hasMore ? '+' : '' }} {{ rows.length === 1 && !hasMore ? 'rij' : 'rijen' }}
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
            loadFailed
              ? 'De lijst is niet geladen.'
              : search
                ? `Niets gevonden voor “${search}”.`
                : 'Geen herstel-dossiers gevonden.'
          "
          @select="select"
        >
          <template #id="{ row }">
            <span class="text-sm font-mono text-faint">#{{ row.id }}</span>
          </template>
          <template #documentName="{ row }">
            <span class="text-lg font-semibold text-body" :title="row.documentName">{{ row.documentName }}</span>
          </template>
          <template #type="{ row }">
            <span class="text-base text-muted">{{ recoveryDocumentTypeLabel(row.type) }}</span>
          </template>
          <template #documentDate="{ row }">
            <span class="text-sm font-mono text-muted">{{ formatDateShort(row.documentDate) }}</span>
          </template>
          <template #reviewer="{ row }">
            <span class="text-base text-muted" :title="row.attribution?.reviewerName ?? undefined">{{ row.attribution?.reviewerName ?? '—' }}</span>
          </template>
          <template #status="{ row }">
            <StatusBadge :status="row.state?.auditStatus" />
          </template>

          <template #footer>
            <span class="text-base text-subtle">
              Pagina {{ page }}<template v-if="!loading && !loadFailed"> · {{ rows.length }} op deze pagina</template>
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
              v-if="canEdit(selected.state?.auditStatus)"
              label="Invoer"
              @click="router.push({ name: 'recovery-edit-2', params: { id: selected.id } })"
            />
          </div>

          <div>
            <h3 class="studio-label mb-1.5">VELDEN</h3>
            <KeyValueList :items="inspectorFields" ratio="38%" />
          </div>
        </div>

        <p v-else class="text-md p-6 text-muted">
          Kies een rij om het dossier hier te bekijken. Enter opent het volledig.
        </p>
      </aside>
    </div>
  </AppShell>
</template>
