<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import FilterChip from '@/components/Common/FilterChip.vue'
import Pill from '@/components/Common/Pill.vue'
import ReviewFilterBuilder from '@/components/Review/ReviewFilterBuilder.vue'
import api from '@/services/fundermaps'
import type { IReviewQueueItem } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { PAGE_SIZE } from '@/services/explorer'
import {
  BUILTIN_VIEWS,
  channelLabel,
  chipsFor,
  customViews,
  deleteView,
  emptyQuery,
  fromView,
  kindLabel,
  outcomeLabel,
  parseQuery,
  saveView,
  toQueueOpts,
  toRouteQuery,
  type ReviewQuery,
  type SavedView,
} from '@/services/reviewExplorer'
import { useStudioStore } from '@/stores/studio'

/**
 * The review queue.
 *
 * Everything here is waiting for a person — including what the pipeline could
 * read nothing from. A photo of a cat is a dossier too, and the way it leaves
 * the line is a reviewer throwing it out, not the software hiding it. It is a
 * waiting line rather than a feed: a terugmelding carries a 24–48 hour
 * promise to whoever sent it, so the oldest submission is always at the top
 * and anything past a week says so.
 *
 * Filtering, sorting, searching and paging work exactly like Rapportages: the
 * whole question lives in the URL (`services/reviewExplorer`), the server
 * answers it, the active parts show as removable chips, and a full page means
 * there is probably another one. Saved views across the top are the same
 * object under a name.
 */
const route = useRoute()
const router = useRouter()
const studio = useStudioStore()

const rows = ref<IReviewQueueItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const query = ref<ReviewQuery>(emptyQuery())
const viewKey = ref('alles')
const views = ref<SavedView[]>([...BUILTIN_VIEWS])
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
/** How many dossiers answer the current question, independent of the page. */
const total = ref<number | null>(null)

const page = computed(() => query.value.page)
const hasMore = computed(() => rows.value.length === PAGE_SIZE)
const chips = computed(() => chipsFor(query.value))

/** Read the URL into state. The address bar is the source of truth, not a mirror. */
function adoptRoute() {
  query.value = parseQuery(route.query as Record<string, unknown>)
  search.value = query.value.q
  const key = typeof route.query.view === 'string' ? route.query.view : 'alles'
  viewKey.value = views.value.some((v) => v.key === key) ? key : 'alles'
}

/** Write state back to the URL, which re-triggers the load through the watcher. */
function push(next: ReviewQuery, key = viewKey.value) {
  router.push({ name: 'review-queue', query: toRouteQuery(next, key) })
}

// Only the newest load may write `total`, or page 3's count lands on page 4's rows.
let loadToken = 0

async function load() {
  const token = ++loadToken
  const opts = toQueueOpts(query.value)
  total.value = null
  api.dataops
    .queueCount(opts)
    .then(({ count }) => void (token === loadToken && (total.value = count)))
    .catch(() => {})
  try {
    loading.value = true
    error.value = null
    rows.value = await api.dataops.queue(opts)
  } catch (e) {
    error.value = describeFailure(e, 'De controlelijst kon niet worden geladen.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

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

// Typing is not navigation until it settles.
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

/**
 * The closed are a different list: no proposals to count, no promise running
 * out, but a reason and a date that answer "why is this not in FunderMaps?".
 * The columns follow the question, the rows keep their shape.
 */
const closedView = computed(() => query.value.outcome.length > 0)

const DESK_COLUMNS: DataColumn[] = [
  { field: 'reference', title: 'Kenmerk', width: '150px' },
  { field: 'subject', title: 'Document', width: 'minmax(260px,1fr)' },
  { field: 'kind', title: 'Soort', width: '170px' },
  { field: 'channel', title: 'Via', width: '90px' },
  { field: 'files', title: 'Bestanden', width: '90px', align: 'right' },
  { field: 'open', title: 'Voorstellen', width: '120px', align: 'right' },
  { field: 'receivedAt', title: 'Ontvangen', width: '190px' },
]
const CLOSED_COLUMNS: DataColumn[] = [
  { field: 'reference', title: 'Kenmerk', width: '150px' },
  { field: 'subject', title: 'Document', width: 'minmax(220px,1fr)' },
  { field: 'kind', title: 'Soort', width: '150px' },
  { field: 'channel', title: 'Via', width: '90px' },
  { field: 'outcome', title: 'Gesloten', width: '170px' },
  { field: 'outcomeNote', title: 'Reden', width: 'minmax(220px,1fr)' },
  { field: 'outcomeAt', title: 'Op', width: '130px' },
]
const columns = computed(() => (closedView.value ? CLOSED_COLUMNS : DESK_COLUMNS))

const WEEK = 7 * 24 * 3600 * 1000
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

const items = computed(() =>
  rows.value.map((r) => ({
    id: r.id,
    reference: r.reference ?? r.externalRef ?? '—',
    subject: r.subject ?? 'Zonder omschrijving',
    kind: r.kind ? kindLabel(r.kind) : null,
    channel: channelLabel(r.channel).toLowerCase(),
    files: r.files,
    open: r.open,
    read: r.read,
    receivedAt: shortDate(r.receivedAt),
    overdue: !r.outcome && Date.now() - new Date(r.receivedAt).getTime() > WEEK,
    outcome: r.outcome ? outcomeLabel(r.outcome).toLowerCase() : null,
    /** `accepted` with a rapportage is a commit; without one it was closed by hand. */
    outcomeTone: (r.outcome === 'accepted' ? 'green' : r.outcome === 'rejected' ? 'red' : 'neutral') as
      | 'green'
      | 'red'
      | 'neutral',
    inquiryId: r.inquiryId,
    duplicateOf: r.duplicateOf,
    outcomeNote: r.outcomeNote?.trim() || null,
    outcomeAt: r.outcomeAt ? shortDate(r.outcomeAt) : null,
  })),
)

function open(row: { id: number }) {
  router.push({ name: 'review-dossier', params: { id: row.id } })
}

/* ------------------------------------------------------------ bulk close */

const selectedIds = ref<Set<string | number>>(new Set())
const bulkNote = ref('')
const bulkBusy = ref(false)

function toggleRow(row: { id: number }) {
  const next = new Set(selectedIds.value)
  if (next.has(row.id)) next.delete(row.id)
  else next.add(row.id)
  selectedIds.value = next
}

function toggleAll() {
  selectedIds.value =
    selectedIds.value.size === items.value.length
      ? new Set()
      : new Set(items.value.map((row) => row.id))
}

/**
 * Close every selected dossier with one outcome. One request, one transaction:
 * the case this exists for is thirty logos in a row, and thirty sequential
 * calls is how you half-close a queue.
 */
async function closeSelected(outcome: 'no_data' | 'rejected' | 'duplicate') {
  const ids = [...selectedIds.value].map(Number)
  if (!ids.length) return
  bulkBusy.value = true
  try {
    await api.dataops.closeMany(ids, { outcome, note: bulkNote.value.trim() || null })
    selectedIds.value = new Set()
    bulkNote.value = ''
    await Promise.all([load(), studio.refreshCounts(null)])
  } catch (e) {
    error.value = describeFailure(e, 'De dossiers konden niet worden gesloten.')
  } finally {
    bulkBusy.value = false
  }
}
</script>

<template>
  <AppShell crumb="Controle" fill>
    <div class="flex shrink-0 items-baseline gap-3 border-b border-line bg-surface px-6 py-3">
      <h1 class="text-lg font-bold text-ink">Controle</h1>
      <p class="text-md flex-1 text-muted">
        Alles wat binnenkwam, ook wat de pipeline niet kon lezen. Niets hiervan staat in
        FunderMaps tot u het overneemt.
      </p>
      <span v-if="studio.controle != null" class="text-md font-mono tabular-nums text-faint">
        {{ studio.controle.toLocaleString('nl-NL') }} open
      </span>
    </div>

    <!-- Saved views, exactly as on Rapportages: the active one carries a
         2px green underline rather than a filled tab. -->
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
          placeholder="Filter op kenmerk, naam, adres, pand-ID of e-mail"
          aria-label="Zoeken in de controlelijst"
        />
      </div>

      <FilterChip
        v-for="chip in chips"
        :key="chip.id"
        :label="chip.label"
        :value="chip.value"
        @remove="push(chip.clear(query))"
      />

      <ReviewFilterBuilder :query="query" @update="push($event)" />

      <span class="text-sm ml-auto font-mono text-faint">
        <template v-if="total != null">{{ total.toLocaleString('nl-NL') }} dossiers</template>
        <template v-else>{{ items.length }}{{ hasMore ? '+' : '' }} rijen</template>
      </span>
    </div>

    <div
      v-if="error"
      class="text-md shrink-0 border-b border-red bg-red-tint px-6 py-2.5 text-red"
    >
      {{ error }}
    </div>

    <div
      v-if="selectedIds.size"
      class="flex shrink-0 flex-wrap items-center gap-3 border-b border-blue-border bg-blue-tint px-6 py-2"
    >
      <span class="text-md font-semibold text-blue-ink">{{ selectedIds.size }} geselecteerd</span>
      <input
        v-model="bulkNote"
        type="text"
        class="studio-control max-w-[360px] flex-1 rounded-md border border-line bg-surface px-2 py-1"
        placeholder="Reden (verplicht bij afwijzen / duplicaat)"
        aria-label="Reden voor sluiten"
      />
      <Button
        label="Sluiten: geen gegevens"
        :disabled="bulkBusy"
        @click="closeSelected('no_data')"
      />
      <Button
        variant="danger"
        label="Afwijzen"
        :disabled="bulkBusy || !bulkNote.trim()"
        @click="closeSelected('rejected')"
      />
      <Button
        label="Duplicaat"
        :disabled="bulkBusy || !bulkNote.trim()"
        @click="closeSelected('duplicate')"
      />
      <button
        type="button"
        class="text-md ml-auto font-semibold text-blue-ink underline underline-offset-2"
        @click="selectedIds = new Set()"
      >
        Selectie wissen
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-auto bg-surface">
      <DataTable
        :rows="items"
        :columns="columns"
        :loading="loading"
        :selected-ids="selectedIds"
        :selectable="!closedView"
        @toggle="toggleRow"
        @toggle-all="toggleAll"
        :empty-message="
          search
            ? `Niets gevonden voor “${search}”.`
            : closedView
              ? 'Geen gesloten dossiers die hieraan voldoen.'
              : chips.length
                ? 'Niets voldoet aan deze filters.'
                : 'Niets te controleren. Alles wat binnenkwam is beoordeeld.'
        "
        @select="open"
      >
        <template #outcome="{ row }">
          <span class="flex items-center gap-1.5">
            <Pill :label="row.outcome ?? '—'" :tone="row.outcomeTone" plain />
            <span v-if="row.inquiryId" class="text-sm font-mono text-faint">#{{ row.inquiryId }}</span>
            <span v-else-if="row.duplicateOf" class="text-sm font-mono text-faint">van {{ row.duplicateOf }}</span>
          </span>
        </template>
        <template #outcomeNote="{ row }">
          <span v-if="row.outcomeNote" class="text-base line-clamp-2 text-muted" :title="row.outcomeNote">
            {{ row.outcomeNote }}
          </span>
          <span v-else class="text-base text-faint">—</span>
        </template>
        <template #outcomeAt="{ row }">
          <span class="text-muted">{{ row.outcomeAt ?? '—' }}</span>
        </template>
        <template #reference="{ row }">
          <span class="text-sm font-mono text-faint">{{ row.reference }}</span>
        </template>
        <template #subject="{ row }">
          <span class="text-lg font-semibold text-body">{{ row.subject }}</span>
        </template>
        <template #kind="{ row }">
          <span v-if="row.kind" class="text-base text-muted">{{ row.kind }}</span>
          <span v-else class="text-base text-faint">—</span>
        </template>
        <template #channel="{ row }">
          <span class="text-base text-muted">{{ row.channel }}</span>
        </template>
        <template #files="{ row }">
          <span class="font-mono tabular-nums text-muted">{{ row.files }}</span>
        </template>
        <template #open="{ row }">
          <span v-if="!row.read" class="flex justify-end">
            <Pill label="nog niet gelezen" tone="amber" plain />
          </span>
          <span v-else-if="row.open === 0" class="flex justify-end">
            <Pill label="niets gevonden" tone="red" plain />
          </span>
          <span v-else class="font-mono tabular-nums text-strong">{{ row.open }}</span>
        </template>
        <template #receivedAt="{ row }">
          <span class="flex items-center gap-2">
            <span class="text-muted">{{ row.receivedAt }}</span>
            <Pill v-if="row.overdue" label="te lang open" tone="amber" plain />
          </span>
        </template>

        <template #footer>
          <span class="text-base text-subtle">
            Pagina {{ page }} · {{ items.length }} op deze pagina
          </span>
          <span class="ml-auto flex gap-1.5">
            <Button label="Vorige" :disabled="page <= 1" @click="push({ ...query, page: page - 1 })" />
            <Button label="Volgende" :disabled="!hasMore" @click="push({ ...query, page: page + 1 })" />
          </span>
        </template>
      </DataTable>
    </div>
  </AppShell>
</template>
