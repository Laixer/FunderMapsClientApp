<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import FilterBuilder from '@/components/Common/FilterBuilder.vue'
import FilterChip from '@/components/Common/FilterChip.vue'
import KeyValueList, { type KeyValueItem } from '@/components/Common/KeyValueList.vue'
import MapPanel from '@/components/Common/MapPanel.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'

import type { SamplePin } from '@/components/Mapbox/SampleMap.vue'
import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import { describeFailure } from '@/services/fundermaps/errors'
import {
  BUILTIN_VIEWS,
  PAGE_SIZE,
  chipsFor,
  customViews,
  deleteView,
  emptyQuery,
  filterByType,
  fromView,
  parseQuery,
  saveView,
  toListOpts,
  toRouteQuery,
  type ExplorerQuery,
  type SavedView,
  type SortField,
} from '@/services/explorer'
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import { countFilledSampleFields } from '@/services/sampleFields'
import { toastError } from '@/services/toast'
import { formatDateShort } from '@/utils/date'
import { useRowKeyboard } from '@/services/useRowKeyboard'
import { useAddressStore } from '@/stores/address'
import { useSessionStore } from '@/stores/session'

/**
 * Rapportages — the explorer, and the heart of the studio.
 *
 * A workspace rather than a page: saved views across the top, the question you
 * are asking spelled out as removable chips, the result set as a dense table,
 * and one dossier open in the inspector beside it. Selecting a row *never*
 * navigates. Triage is a rhythm — look, judge, move on — and a page load
 * between every two rows is what breaks it.
 *
 * The whole query lives in the URL, so a view is a link. Filtering, sorting and
 * paging are server-side through one options object (`toListOpts`); the one
 * exception is type, which `GET /inquiry` does not support and which is
 * therefore narrowed on the visible page — said out loud in the filter popover
 * rather than quietly half-working.
 */
const route = useRoute()
const router = useRouter()
const addressStore = useAddressStore()
const { currentUser } = storeToRefs(useSessionStore())

/* ------------------------------------------------------------- query state */

const query = ref<ExplorerQuery>(emptyQuery())
const viewKey = ref('alles')
const search = ref('')
const debouncedSearch = refDebounced(search, 300)

const views = ref<SavedView[]>([...BUILTIN_VIEWS])

const rows: Ref<IInquiry[]> = ref([])
const loading = ref(true)
/**
 * A full page means there is probably another one. The list endpoint returns
 * rows and no total, so "1–50 van 1.284" is not a sentence this app can
 * truthfully write — it says "50 op deze pagina" and offers Volgende instead.
 */
const hasMore = computed(() => rows.value.length === PAGE_SIZE)

const visibleRows = computed(() => filterByType(rows.value, query.value.type))
const chips = computed(() => chipsFor(query.value))

/** Read the URL into state. The address bar is the source of truth, not a mirror. */
function adoptRoute() {
  query.value = parseQuery(route.query as Record<string, unknown>)
  search.value = query.value.q
  const key = typeof route.query.view === 'string' ? route.query.view : 'alles'
  viewKey.value = views.value.some((view) => view.key === key) ? key : 'alles'
}

/** Write state back to the URL, which re-triggers the load through the watcher. */
function push(next: ExplorerQuery, key = viewKey.value) {
  router.push({ name: 'inquiry-list', query: toRouteQuery(next, key) })
}

async function load() {
  try {
    loading.value = true
    rows.value = await api.inquiry.list(toListOpts(query.value, currentUser.value?.id ?? null))
  } catch (e) {
    toastError(describeFailure(e, 'De rapportages konden niet worden opgehaald.'))
    rows.value = []
  } finally {
    loading.value = false
  }
}

// Adopted during setup rather than in `onBeforeMount`, so the tabs, the chips
// and the table all render the URL's question on the very first pass. Deferring
// it costs one frame of the unfiltered view — which on a shared link is exactly
// the frame someone screenshots.
views.value = [...BUILTIN_VIEWS, ...customViews()]
adoptRoute()

onBeforeMount(load)

watch(
  () => route.query,
  () => {
    adoptRoute()
    load()
  },
)

// The session restores asynchronously, and `mine` filters need the user id.
watch(currentUser, () => {
  if (query.value.mine) load()
})

// Typing is not navigation until it settles: a router push per keystroke would
// fill the history with half-typed searches.
watch(debouncedSearch, (q) => {
  if (q === query.value.q) return
  push({ ...query.value, q, page: 1 })
})

/* ------------------------------------------------------------- saved views */

function selectView(view: SavedView) {
  push({ ...fromView(view) }, view.key)
}

function onSaveView() {
  const label = window.prompt('Naam voor deze weergave')?.trim()
  if (!label) return
  const view = saveView(label, query.value)
  views.value = [...BUILTIN_VIEWS, ...customViews()]
  push(query.value, view.key)
}

function onDeleteView(view: SavedView) {
  deleteView(view.key)
  views.value = [...BUILTIN_VIEWS, ...customViews()]
  if (viewKey.value === view.key) push(emptyQuery(), 'alles')
}

/* ------------------------------------------------------------------ table */

const COLUMNS: DataColumn[] = [
  { field: 'id', title: 'ID', width: '84px', sortable: true },
  { field: 'documentName', title: 'Naam', width: 'minmax(260px,1fr)', sortable: true },
  { field: 'type', title: 'Type', width: '148px', sortable: true },
  { field: 'documentDate', title: 'Datum', width: '92px', sortable: true },
  { field: 'reviewer', title: 'Beoordelaar', width: '150px', sortable: true },
  { field: 'status', title: 'Status', width: '128px', sortable: true },
]

/** Table column field → API sort key. */
const SORT_KEYS: Record<string, SortField> = {
  id: 'id',
  documentName: 'document_name',
  type: 'type',
  documentDate: 'document_date',
  reviewer: 'reviewer',
  status: 'status',
}

const sortField = computed(() =>
  Object.keys(SORT_KEYS).find((field) => SORT_KEYS[field] === query.value.sort) ?? null,
)

// desc → asc → back to default recency ordering. Descending first, because
// that is what "sorteer op datum" means, and because the filter popover's sort
// section starts there too — two controls writing one piece of state should not
// disagree about which way the first click points.
function onSort(field: string) {
  const key = SORT_KEYS[field]
  if (!key) return
  if (query.value.sort !== key) push({ ...query.value, sort: key, order: 'desc', page: 1 })
  else if (query.value.order === 'desc') push({ ...query.value, order: 'asc', page: 1 })
  else push({ ...query.value, sort: null, order: 'desc', page: 1 })
}

const selectedIds = ref<Set<string | number>>(new Set())

function toggleRow(row: IInquiry) {
  const next = new Set(selectedIds.value)
  if (next.has(row.id)) next.delete(row.id)
  else next.add(row.id)
  selectedIds.value = next
}

function toggleAll() {
  selectedIds.value = selectedIds.value.size === visibleRows.value.length
    ? new Set()
    : new Set(visibleRows.value.map((row) => row.id))
}

/* -------------------------------------------------------------- inspector */

const selected = ref<IInquiry | null>(null)
const selectedPins = ref<SamplePin[]>([])
const selectedAddressCount = ref<number | null>(null)
const selectedFilled = ref<number | null>(null)
const inspectorLoading = ref(false)

/**
 * Every selection is tagged and only the newest may write: clicking down a
 * table faster than the geocoder answers would otherwise leave the inspector
 * showing one dossier's fields over another dossier's map.
 */
let selectionToken = 0

async function select(row: IInquiry) {
  selected.value = row
  const token = ++selectionToken
  inspectorLoading.value = true
  selectedPins.value = []
  selectedAddressCount.value = null
  selectedFilled.value = null

  try {
    const samples = await api.inquirySample.listAll(row.id)
    if (token !== selectionToken) return
    selectedAddressCount.value = samples.length
    selectedFilled.value = samples.reduce((n, s) => n + countFilledSampleFields(s), 0)

    await addressStore.ensureMany(samples.map((s) => s.address))
    if (token !== selectionToken) return
    selectedPins.value = samples.flatMap((s) => {
      const address = addressStore.cache[s.address]
      // Coordinates come back null when the linked building has no geometry;
      // those addresses simply do not get a pin.
      return address?.latitude != null && address.longitude != null
        ? [{ id: s.id, lat: address.latitude, lng: address.longitude }]
        : []
    })
  } catch {
    // The inspector's extras are enrichment. Losing them costs the map and two
    // counts; the summary and the actions still work.
    if (token === selectionToken) selectedAddressCount.value = null
  } finally {
    if (token === selectionToken) inspectorLoading.value = false
  }
}

const inspectorFields = computed<KeyValueItem[]>(() => {
  const row = selected.value
  if (!row) return []
  return [
    { label: 'Type', value: inquiryTypeLabel(row.type) },
    { label: 'Uitvoerder', value: row.attribution.contractorName },
    { label: 'Opsteller', value: row.attribution.creatorName },
    { label: 'Beoordelaar', value: row.attribution.reviewerName },
    { label: 'Data-eigenaar', value: row.attribution.dataOwnerName },
    { label: 'Documentdatum', value: formatDateShort(row.documentDate), mono: true },
    { label: 'F3O standaard', value: row.standardF3o ? 'Ja' : 'Nee' },
    { label: 'Voegmeting', value: row.jointMeasurement ? 'Ja' : 'Nee' },
    { label: 'Inspectie', value: row.inspection ? 'Ja' : 'Nee' },
    { label: 'Vloermeting', value: row.floorMeasurement ? 'Ja' : 'Nee' },
  ]
})

const inspectorSummary = computed(() => {
  const row = selected.value
  if (!row) return ''
  const parts = [inquiryTypeLabel(row.type), formatDateShort(row.documentDate)]
  if (selectedAddressCount.value != null) {
    parts.push(
      selectedAddressCount.value === 1 ? '1 adres' : `${selectedAddressCount.value} adressen`,
    )
  }
  return parts.join(' · ')
})

// j / k / Enter over the table. Enter opens the dossier; j/k only move the
// inspector, which is the whole point of the two-pane layout.
const { activeId } = useRowKeyboard({
  rows: visibleRows,
  onOpen: (row) => router.push({ name: 'inquiry-view', params: { id: row.id } }),
})

watch(activeId, (id) => {
  const row = visibleRows.value.find((r) => r.id === id)
  if (row) select(row)
})

/* ------------------------------------------------------------- view modes */

type Mode = 'tabel' | 'kaart' | 'split'
const mode = ref<Mode>('tabel')
const MODES: { key: Mode; label: string }[] = [
  { key: 'tabel', label: 'Tabel' },
  { key: 'kaart', label: 'Kaart' },
  { key: 'split', label: 'Split' },
]
</script>

<template>
  <AppShell crumb="Rapportages" fill>
    <!-- Saved views. The active one carries a 2px green underline rather than a
         filled tab: these sit directly on the white filter bar, and a filled
         tab there would read as a button. -->
    <div class="flex shrink-0 items-center gap-1.5 border-b border-line bg-surface px-6 pt-2.5">
      <button
        v-for="view in views"
        :key="view.key"
        type="button"
        class="text-lg group flex items-center gap-1.5 border-b-2 px-3 pt-1.5 pb-2.5"
        :class="
          viewKey === view.key
            ? 'border-green font-bold text-ink'
            : 'border-transparent font-medium text-subtle hover:text-strong'
        "
        @click="selectView(view)"
      >
        {{ view.label }}
        <span
          v-if="!view.builtin"
          class="text-xs text-label opacity-0 group-hover:opacity-100 hover:text-red"
          role="button"
          :aria-label="`Weergave ${view.label} verwijderen`"
          @click.stop="onDeleteView(view)"
        >
          ×
        </span>
      </button>

      <button
        type="button"
        class="text-sm ml-1.5 mb-2 rounded-md border border-dashed border-line-strong bg-surface px-2.5 py-1.5 text-subtle hover:border-line-hover hover:text-strong"
        @click="onSaveView"
      >
        + Weergave
      </button>
    </div>

    <div class="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
      <div
        class="flex max-w-[340px] flex-1 items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-1.5"
      >
        <span aria-hidden="true" class="text-md text-faint">⌕</span>
        <input
          v-model="search"
          type="search"
          class="studio-control"
          placeholder="Filter op naam, ID, adres of pand-ID"
          aria-label="Zoeken in rapportages"
        />
      </div>

      <FilterChip
        v-for="chip in chips"
        :key="chip.id"
        :label="chip.label"
        :value="chip.value"
        @remove="push(chip.clear(query))"
      />

      <FilterBuilder :query="query" @update="push($event)" />

      <div class="ml-auto flex items-center gap-2">
        <span class="text-sm font-mono text-faint">
          {{ visibleRows.length }}{{ hasMore ? '+' : '' }} rijen
        </span>
        <div class="flex rounded-lg border border-line bg-canvas p-0.5">
          <button
            v-for="option in MODES"
            :key="option.key"
            type="button"
            class="text-sm rounded-md px-2.5 py-1 font-semibold"
            :class="
              mode === option.key ? 'bg-surface text-strong shadow-segment' : 'text-subtle'
            "
            @click="mode = option.key"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="selectedIds.size"
      class="flex shrink-0 items-center gap-3 border-b border-blue-border bg-blue-tint px-6 py-2"
    >
      <span class="text-md font-semibold text-blue-ink">
        {{ selectedIds.size }} geselecteerd
      </span>
      <button
        type="button"
        class="text-md font-semibold text-blue-ink underline underline-offset-2"
        @click="selectedIds = new Set()"
      >
        Selectie wissen
      </button>
      <!-- Bulk assign / approve / export are deliberately absent: the API has
           no batch endpoints, and a button that fires fifty sequential requests
           is a way to half-approve a queue. -->
      <span class="text-sm ml-auto text-blue-soft">
        Bulkacties volgen zodra de API ze ondersteunt.
      </span>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-[minmax(var(--spacing-table-min),1fr)_var(--spacing-inspector)]">
      <div class="flex min-w-0 flex-col">
        <div
          v-if="mode !== 'kaart'"
          class="min-w-0 overflow-auto bg-surface"
          :class="mode === 'split' ? 'h-3/5' : 'flex-1'"
        >
          <DataTable
            :rows="visibleRows"
            :columns="COLUMNS"
            :loading="loading"
            :active-id="selected?.id ?? null"
            :selected-ids="selectedIds"
            selectable
            :sort-field="sortField"
            :sort-order="query.order"
            :empty-message="
              query.q ? `Niets gevonden voor “${query.q}”.` : 'Geen rapportages in deze weergave.'
            "
            @select="select"
            @sort="onSort"
            @toggle="toggleRow"
            @toggle-all="toggleAll"
          >
            <template #id="{ row }">
              <span class="text-sm font-mono text-faint">#{{ row.id }}</span>
            </template>
            <template #documentName="{ row }">
              <span class="text-lg font-semibold text-body">{{ row.documentName }}</span>
            </template>
            <template #type="{ row }">
              <span class="text-base text-muted">{{ inquiryTypeLabel(row.type) }}</span>
            </template>
            <template #documentDate="{ row }">
              <span class="text-sm font-mono text-muted">
                {{ formatDateShort(row.documentDate) }}
              </span>
            </template>
            <template #reviewer="{ row }">
              <span class="text-base text-muted">{{ row.attribution?.reviewerName ?? '—' }}</span>
            </template>
            <template #status="{ row }">
              <StatusBadge :status="row.state?.auditStatus" />
            </template>

            <template #footer>
              <span class="text-base text-subtle">
                Pagina {{ query.page }} · {{ visibleRows.length }} op deze pagina
              </span>
              <span class="ml-auto flex gap-1.5">
                <Button
                  label="Vorige"
                  :disabled="query.page <= 1"
                  @click="push({ ...query, page: query.page - 1 })"
                />
                <Button
                  label="Volgende"
                  :disabled="!hasMore"
                  @click="push({ ...query, page: query.page + 1 })"
                />
              </span>
            </template>
          </DataTable>
        </div>

        <!-- The map plots the *selected* dossier's addresses, not the whole
             result set: a page of fifty rows would need fifty sample lookups
             plus geocoding to place, which is not a trade worth making for a
             pane you glance at. -->
        <div
          v-if="mode !== 'tabel'"
          class="min-h-0 border-t border-line"
          :class="mode === 'split' ? 'h-2/5' : 'flex-1'"
        >
          <MapPanel
            :pins="selectedPins"
            height="100%"
            :empty-message="
              selected
                ? 'Dit dossier heeft nog geen adressen met een bekende locatie.'
                : 'Kies een rij om de panden op de kaart te zien.'
            "
          />
        </div>
      </div>

      <aside class="flex min-h-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <template v-if="selected">
          <MapPanel
            v-if="mode === 'tabel'"
            :pins="selectedPins"
            :empty-message="
              inspectorLoading ? 'Locatie ophalen…' : 'Geen adres met een bekende locatie.'
            "
          />

          <div class="flex flex-col gap-4 p-4">
            <div class="flex flex-col gap-1">
              <span class="text-sm font-mono text-faint">#{{ selected.id }}</span>
              <h2 class="text-3xl font-display font-bold break-words text-ink">
                {{ selected.documentName }}
              </h2>
              <p class="text-md text-muted">{{ inspectorSummary }}</p>
              <StatusBadge class="mt-1.5 self-start" :status="selected.state?.auditStatus" />
            </div>

            <div class="flex gap-2">
              <Button
                variant="primary"
                label="Dossier openen"
                block
                @click="router.push({ name: 'inquiry-view', params: { id: selected.id } })"
              />
              <Button
                label="Invoer"
                @click="router.push({ name: 'inquiry-edit-2', params: { id: selected.id } })"
              />
            </div>

            <div>
              <h3 class="studio-label mb-1.5">VELDEN</h3>
              <KeyValueList :items="inspectorFields" ratio="46%" />
            </div>

            <p v-if="selectedFilled != null" class="text-sm text-label">
              {{ selectedFilled }} ingevulde waarden over
              {{ selectedAddressCount }} {{ selectedAddressCount === 1 ? 'adres' : 'adressen' }}.
            </p>
          </div>
        </template>

        <p v-else class="text-md p-6 text-muted">
          Kies een rij om het dossier hier te bekijken. Enter opent het volledig.
        </p>
      </aside>
    </div>
  </AppShell>
</template>
