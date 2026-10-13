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
import { canEdit } from '@/services/pipeline'
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
import { promptText } from '@/services/prompt'
import { toastError } from '@/services/toast'
import { formatDateShort } from '@/utils/date'
import { useRowKeyboard } from '@/services/useRowKeyboard'
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
 * paging are all server-side through one options object (`toListOpts`);
 * `filterByType` re-narrows the page purely as belt-and-braces against an API
 * that predates the `?type=` parameter.
 */
const route = useRoute()
const router = useRouter()
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
 * The exact size of the current result set, from `/inquiry/stats` with the
 * same filters. `null` while unanswered or failed — then the footer falls
 * back to "N op deze pagina", which is all a page of rows can truthfully say.
 */
const total = ref<number | null>(null)
const hasMore = computed(() =>
  total.value != null
    ? query.value.page * PAGE_SIZE < total.value
    : rows.value.length === PAGE_SIZE,
)

const visibleRows = computed(() => filterByType(rows.value, query.value.type))
const chips = computed(() => chipsFor(query.value))

/** Read the URL into state. The address bar is the source of truth, not a mirror. */
function adoptRoute() {
  const key = typeof route.query.view === 'string' ? route.query.view : 'alles'
  const view = views.value.find((candidate) => candidate.key === key)
  viewKey.value = view ? key : 'alles'
  // A link that names only a view (the tiles on Vandaag, a bookmark) asks that
  // view's own question. It used to open the whole archive under the
  // underlined tab "Te controleren".
  const bare = !QUESTION_PARAMS.some((param) => route.query[param] !== undefined)
  query.value = view && bare ? fromView(view) : parseQuery(route.query as Record<string, unknown>)
  search.value = query.value.q
}

/** The query-string parameters that make up the question, as opposed to naming a view. */
const QUESTION_PARAMS = ['q', 'status', 'type', 'mine', 'sort', 'order', 'page'] as const

/** Whether two queries ask for the same rows; order and page are how you look at them. */
function sameFilters(a: ExplorerQuery, b: ExplorerQuery): boolean {
  const list = (values: number[]) => [...values].sort((x, y) => x - y).join(',')
  return a.q === b.q && a.mine === b.mine && list(a.status) === list(b.status) && list(a.type) === list(b.type)
}

/** Write state back to the URL, which re-triggers the load through the watcher. */
function push(next: ExplorerQuery, key = viewKey.value) {
  // A tab is the name of its question. Take a filter away and the underline
  // goes back to "Alles", rather than staying under "Concepten" over all rows.
  const view = views.value.find((candidate) => candidate.key === key)
  if (view && !sameFilters(next, fromView(view))) key = 'alles'
  router.push({ name: 'inquiry-list', query: toRouteQuery(next, key) })
}

// Guards the fire-and-forget count against a faster next query: only the
// newest load may write `total`, or page 3's count lands on page 4's rows.
let loadToken = 0

async function load() {
  const token = ++loadToken
  const opts = toListOpts(query.value, currentUser.value?.id ?? null)
  // The count rides along but never gates the page: rows without a total is
  // a working table, a total without rows is not. Cleared first — the old
  // query's total over the new query's rows would be a wrong number.
  total.value = null
  api.inquiry
    .getCount(opts)
    .then(({ count }) => void (token === loadToken && (total.value = count)))
    .catch(() => {})
  try {
    loading.value = true
    rows.value = await api.inquiry.list(opts)
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

async function onSaveView() {
  const label = await promptText({
    title: 'Weergave opslaan',
    label: 'Naam voor deze weergave',
    confirmLabel: 'Opslaan',
  })
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
  // Status is 140px: its longest pill ("Nog te beoordelen") is 132px and was cut
  // flat by a 128px column. The 12px come off the name's minimum, so the fixed
  // columns still fit the table at the shell's minimum width.
  { field: 'documentName', title: 'Naam', width: 'minmax(248px,1fr)', sortable: true },
  { field: 'type', title: 'Soort', width: '148px', sortable: true },
  { field: 'documentDate', title: 'Datum', width: '92px', sortable: true },
  // Up to 210px where the window has room: at 150px the usual value (an e-mail
  // address) was cut in every row. Still 150px at the shell's minimum width.
  { field: 'reviewer', title: 'Beoordelaar', width: 'minmax(150px,210px)', sortable: true },
  { field: 'status', title: 'Status', width: '140px', sortable: true },
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

// A new column sorts descending; the same column again flips the direction.
// There is no third click that switches sorting off, because the explorer is
// always sorted by something — see `DEFAULT_SORT`. Descending first, because
// that is what "sorteer op datum" means, and because the filter popover starts
// there too: two controls writing one piece of state should not disagree about
// which way the first click points.
function onSort(field: string) {
  const key = SORT_KEYS[field]
  if (!key) return
  if (query.value.sort !== key) push({ ...query.value, sort: key, order: 'desc', page: 1 })
  else push({ ...query.value, order: query.value.order === 'desc' ? 'asc' : 'desc', page: 1 })
}

// No row checkboxes: there is no bulk action to stage rows for (the API has no
// batch endpoints), and a tick that only raises a count is a control that does
// nothing. `DataTable` still has them (`selectable`) for the day there is one.

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
  setActive(row.id)
  const token = ++selectionToken
  inspectorLoading.value = true
  selectedPins.value = []
  selectedAddressCount.value = null
  selectedFilled.value = null

  try {
    // One call. This used to page through every sample of the dossier (75
    // columns, 500 a page; the largest carries 49,753) and then resolve each
    // address through the geocoder just to count and draw pins.
    const summary = await api.inquirySample.getSummary(row.id)
    if (token !== selectionToken) return
    selectedAddressCount.value = summary.count
    selectedFilled.value = summary.filled
    selectedPins.value = summary.pins.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude }))
  } catch {
    // The inspector's extras are enrichment. Losing them costs the map and two
    // counts; the summary and the actions still work.
    if (token === selectionToken) selectedAddressCount.value = null
  } finally {
    if (token === selectionToken) inspectorLoading.value = false
  }
}

// The inspector shows a row of the list on screen. When another view, a search
// or a page turn takes that row away, the pane closes: it used to go on showing
// a rapportage next to a table that said "Niets gevonden".
watch(visibleRows, (rows) => {
  const row = selected.value
  if (!row || rows.some((r) => r.id === row.id)) return
  // Also for a summary still under way, so it cannot fill the pins afterwards.
  selectionToken++
  selected.value = null
  selectedPins.value = []
  selectedAddressCount.value = null
  selectedFilled.value = null
  inspectorLoading.value = false
})

const inspectorFields = computed<KeyValueItem[]>(() => {
  const row = selected.value
  if (!row) return []
  return [
    { label: 'Soort', value: inquiryTypeLabel(row.type) },
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
const { activeId, setActive } = useRowKeyboard({
  rows: visibleRows,
  onOpen: (row) => router.push({ name: 'inquiry-view', params: { id: row.id } }),
})

watch(activeId, (id) => {
  const row = visibleRows.value.find((r) => r.id === id)
  // Not the row that is selected already: a click sets both, and must not load its summary twice.
  if (row && selected.value?.id !== row.id) select(row)
})

/* ------------------------------------------------------------- view modes */

type Mode = 'tabel' | 'kaart' | 'split'
const mode = ref<Mode>('tabel')
const MODES: { key: Mode; label: string }[] = [
  { key: 'tabel', label: 'Tabel' },
  { key: 'kaart', label: 'Kaart' },
  { key: 'split', label: 'Gesplitst' },
]
</script>

<template>
  <AppShell crumb="Rapportages" fill>
    <!-- The crumb names the screen for the eye; this names it for a screen
         reader and for anyone jumping by heading. -->
    <h1 class="sr-only">Rapportages</h1>
    <!-- Saved views. The active one carries a 2px green underline rather than a
         filled tab: these sit directly on the white filter bar, and a filled
         tab there would read as a button. -->
    <div class="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-line bg-surface px-6 pt-2.5">
      <!-- The tab and its delete cross are two buttons side by side: a cross
           *inside* the tab button could not be reached with the keyboard. -->
      <span
        v-for="view in views"
        :key="view.key"
        class="group flex shrink-0 items-center border-b-2 pt-1.5 pb-2.5"
        :class="viewKey === view.key ? 'border-green' : 'border-transparent'"
      >
        <button
          type="button"
          class="text-lg px-3 whitespace-nowrap"
          :class="
            viewKey === view.key ? 'font-bold text-ink' : 'font-medium text-subtle hover:text-strong'
          "
          :aria-current="viewKey === view.key ? 'page' : undefined"
          @click="selectView(view)"
        >
          {{ view.label }}
        </button>
        <button
          v-if="!view.builtin"
          type="button"
          class="text-xs -ml-1.5 mr-1.5 px-1 text-label opacity-0 group-hover:opacity-100 hover:text-red focus-visible:opacity-100"
          :aria-label="`Weergave ${view.label} verwijderen`"
          @click="onDeleteView(view)"
        >
          ×
        </button>
      </span>

      <button
        type="button"
        class="text-sm ml-1.5 mb-2 rounded-md border border-dashed border-line-strong bg-surface px-2.5 py-1.5 text-subtle hover:border-line-hover hover:text-strong"
        @click="onSaveView"
      >
        + Weergave
      </button>
    </div>

    <!-- Wraps onto a second line once the chips no longer fit: squeezed onto one
         line, the search box shrank to its icon and the button broke in three. -->
    <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
      <div
        class="flex max-w-[340px] min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-1.5 focus-within:border-green focus-within:ring-2 focus-within:ring-green/30"
      >
        <span aria-hidden="true" class="text-md text-faint">⌕</span>
        <input
          v-model="search"
          type="search"
          class="studio-control"
          placeholder="Filter op naam, nummer of BAG-ID"
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
        <span class="text-sm shrink-0 font-mono whitespace-nowrap text-faint">
          <template v-if="total != null">
            {{ total.toLocaleString('nl-NL') }} {{ total === 1 ? 'rij' : 'rijen' }}
          </template>
          <template v-else>
            {{ visibleRows.length }}{{ hasMore ? '+' : '' }}
            {{ visibleRows.length === 1 && !hasMore ? 'rij' : 'rijen' }}
          </template>
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
            :aria-pressed="mode === option.key"
            @click="mode = option.key"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-[minmax(var(--spacing-table-min),1fr)_var(--spacing-inspector)]">
      <div class="flex min-h-0 min-w-0 flex-col">
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
            :sort-field="sortField"
            :sort-order="query.order"
            :empty-message="
              query.q ? `Niets gevonden voor “${query.q}”.` : 'Geen rapportages in deze weergave.'
            "
            @select="select"
            @sort="onSort"
          >
            <template #id="{ row }">
              <span class="text-sm font-mono text-faint">#{{ row.id }}</span>
            </template>
            <template #documentName="{ row }">
              <span class="text-lg font-semibold text-body" :title="row.documentName">{{ row.documentName }}</span>
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
              <span class="text-base text-muted" :title="row.attribution?.reviewerName ?? undefined">{{ row.attribution?.reviewerName ?? '—' }}</span>
            </template>
            <template #status="{ row }">
              <StatusBadge :status="row.state?.auditStatus" />
            </template>

            <template #footer>
              <span class="text-base text-subtle">
                Pagina {{ query.page.toLocaleString('nl-NL')
                }}<template v-if="total != null">
                  van {{ Math.max(1, Math.ceil(total / PAGE_SIZE)).toLocaleString('nl-NL') }}</template>
                ·
                {{
                  total != null
                    ? `${total.toLocaleString('nl-NL')} in totaal`
                    : `${visibleRows.length} op deze pagina`
                }}
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
                : mode === 'kaart'
                  ? 'Kies eerst een rij in Tabel of Gesplitst; de kaart toont de panden van die rapportage.'
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
                v-if="canEdit(selected.state?.auditStatus)"
                label="Invoer"
                @click="router.push({ name: 'inquiry-edit-samples', params: { id: selected.id } })"
              />
            </div>

            <div>
              <h3 class="studio-label mb-1.5">VELDEN</h3>
              <KeyValueList :items="inspectorFields" ratio="38%" />
            </div>

            <p v-if="selectedFilled != null" class="text-sm text-label">
              {{ selectedFilled }} {{ selectedFilled === 1 ? 'ingevulde waarde' : 'ingevulde waarden' }} over
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
