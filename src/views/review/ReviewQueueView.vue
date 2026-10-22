<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import PageHeader from '@/components/Common/PageHeader.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import FilterChip from '@/components/Common/FilterChip.vue'
import Pill from '@/components/Common/Pill.vue'
import ReviewFilterBuilder from '@/components/Review/ReviewFilterBuilder.vue'
import api from '@/services/fundermaps'
import type { IReviewQueueItem } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { confirmAction } from '@/services/confirm'
import { PAGE_SIZE } from '@/services/explorer'
import { promptText } from '@/services/prompt'
import { nalezingNumber, outcomeTone } from '@/services/reviewLabels'
import {
  DEFAULT_VIEW,
  channelLabel,
  chipsFor,
  defaultView,
  emptyQuery,
  fromView,
  inSentence,
  isWideSearch,
  kindLabel,
  outcomeLabel,
  parseQuery,
  routeViewKey,
  saveView,
  toQueueOpts,
  toRouteQuery,
  type ReviewQuery,
} from '@/services/reviewExplorer'
import { useRowKeyboard } from '@/services/useRowKeyboard'
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
 * there is probably another one. Saved views are the same object under a
 * name, grouped by what we do with the dossier: answer a melder, enter a
 * document, or nothing any more (`viewGroups`). The sidebar lists them under
 * Controle with their counts, like a mailbox's folders.
 */
const route = useRoute()
const router = useRouter()
const studio = useStudioStore()

const rows = ref<IReviewQueueItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
/** The list itself did not load: no counts then, they would count rows that are not there. */
const loadFailed = ref(false)

const query = ref<ReviewQuery>(fromView(defaultView()))
const viewKey = ref(DEFAULT_VIEW)
const activeGroup = computed(
  () =>
    studio.reviewGroups.find((g) => g.views.includes(viewKey.value)) ??
    studio.reviewGroups[studio.reviewGroups.length - 1],
)
const viewLabel = computed(
  () => studio.reviewViews.find((v) => v.key === viewKey.value)?.label ?? 'Alles',
)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
/** How many dossiers answer the current question, independent of the page. */
const total = ref<number | null>(null)

const page = computed(() => query.value.page)
const hasMore = computed(() => rows.value.length === PAGE_SIZE)
const chips = computed(() => chipsFor(query.value))

/**
 * Read the URL into state. The address bar is the source of truth, not a mirror.
 *
 * The bare link (the sidebar's) is first written out as the default tab's, so
 * the URL says which list this is: a dossier opened from here takes it along
 * and picks its "next" from the same list. Returns false then; the watcher
 * reads the written-out URL.
 */
function adoptRoute(): boolean {
  const raw = route.query as Record<string, unknown>
  if (!Object.keys(raw).length) {
    router.replace({
      name: 'review-queue',
      query: toRouteQuery(fromView(defaultView()), DEFAULT_VIEW),
    })
    return false
  }
  query.value = parseQuery(raw)
  search.value = query.value.q
  viewKey.value = routeViewKey(raw, (key) => studio.reviewViews.some((v) => v.key === key))
  return true
}

/** Write state back to the URL, which re-triggers the load through the watcher. */
function push(next: ReviewQuery, key = viewKey.value) {
  router.push({ name: 'review-queue', query: toRouteQuery(next, key) })
}

// Only the newest load may write `total`, or page 3's count lands on page 4's rows.
let loadToken = 0

async function load() {
  const token = ++loadToken
  const opts = toQueueOpts(query.value, viewKey.value)
  total.value = null
  api.dataops
    .queueCount(opts)
    .then(({ count }) => void (token === loadToken && (total.value = count)))
    .catch(() => {})
  try {
    loading.value = true
    error.value = null
    loadFailed.value = false
    rows.value = await api.dataops.queue(opts)
  } catch (e) {
    error.value = describeFailure(e, 'De controlelijst kon niet worden geladen.')
    loadFailed.value = true
    rows.value = []
  } finally {
    loading.value = false
  }
}

// Saved in another tab of this browser since the Studio loaded: a link to it should still open it.
studio.reloadReviewViews()
const adopted = adoptRoute()
onBeforeMount(() => {
  if (adopted) load()
})

watch(
  () => route.query,
  () => {
    if (adoptRoute()) load()
  },
)

// Typing is not navigation until it settles.
watch(debouncedSearch, (q) => {
  if (q === query.value.q) return
  push({ ...query.value, q, page: 1 })
})

/* ------------------------------------------------------------- saved views */

// Opening, and deleting, a view happens in the sidebar (Sidebar.vue).
async function onSaveView() {
  const label = await promptText({
    title: 'Weergave opslaan',
    label: 'Naam voor deze weergave',
    confirmLabel: 'Opslaan',
  })
  if (!label) return
  const view = saveView(label, query.value)
  studio.reloadReviewViews()
  push(query.value, view.key)
  void studio.refreshViewCounts()
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
  // The dossier's pand (2026-10-22): its whole story is one click from the list.
  { field: 'pand', title: 'Pand', width: '64px' },
]
/**
 * A page with a dossier that lies with a colleague: the last column also holds
 * "bij <naam>", which 190px cut off after the first letter. It gets 300px then,
 * taken from Document, and the list still fits the smallest window (1528px)
 * with a scrollbar beside it. Only on such a page: Document keeps its room on
 * every other one.
 */
const DESK_COLUMNS_ASSIGNED: DataColumn[] = DESK_COLUMNS.map((c) =>
  c.field === 'receivedAt' ? { ...c, width: '300px' } : c,
)
const CLOSED_COLUMNS: DataColumn[] = [
  { field: 'reference', title: 'Kenmerk', width: '150px' },
  { field: 'subject', title: 'Document', width: 'minmax(220px,1fr)' },
  { field: 'kind', title: 'Soort', width: '150px' },
  { field: 'channel', title: 'Via', width: '90px' },
  { field: 'outcome', title: 'Gesloten', width: '170px' },
  { field: 'outcomeNote', title: 'Reden', width: 'minmax(220px,1fr)' },
  { field: 'outcomeAt', title: 'Op', width: '130px' },
  { field: 'pand', title: 'Pand', width: '64px' },
]
/**
 * A meldcode or a dossier id names one dossier, and the API answers it in any
 * state (#361) — so the desk can hand back something that was closed days ago.
 * Show the closed columns then, because the next question is always the one
 * they came with: "why is this not in FunderMaps?".
 */
const PINPOINT = /^(FM\d{4}-\d{6}|\d+)$/i
/** A search on "Alles" reaches closed dossiers too (API #191); same columns then, for the same reason. */
const wideSearch = computed(() => isWideSearch(query.value, viewKey.value))
const closedHit = computed(
  () => (PINPOINT.test(search.value.trim()) || wideSearch.value) && rows.value.some((r) => r.outcome),
)
const columns = computed(() =>
  closedView.value || closedHit.value
    ? CLOSED_COLUMNS
    : rows.value.some((r) => r.assignedName)
      ? DESK_COLUMNS_ASSIGNED
      : DESK_COLUMNS,
)

const WEEK = 7 * 24 * 3600 * 1000
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

const items = computed(() =>
  rows.value.map((r) => ({
    id: r.id,
    // A nalezing has no meldcode; its own reference is "audit:inquiry:<nummer>".
    reference: r.reference ?? (nalezingNumber(r) ? `nalezing #${nalezingNumber(r)}` : r.externalRef) ?? '—',
    subject: r.subject ?? 'Zonder omschrijving',
    kind: r.kind ? kindLabel(r.kind) : null,
    channel: inSentence(channelLabel(r.channel)),
    files: r.files,
    open: r.open,
    read: r.read,
    receivedAt: shortDate(r.receivedAt),
    // Only where a melder waits: the 24–48 hour promise is to them. On the
    // archive drop, the nalezingen and Fundie's leads it stood on 1,019 rows
    // (2026-10-22), and a pill on every row says nothing.
    overdue:
      !r.outcome && r.channel === 'upload' && Date.now() - new Date(r.receivedAt).getTime() > WEEK,
    assignedName: r.assignedName ?? null,
    outcome: r.outcome ? outcomeLabel(r.outcome).toLowerCase() : null,
    /** `accepted` with a rapportage is a commit; without one it was closed by hand. */
    outcomeTone: outcomeTone(r.outcome),
    inquiryId: r.inquiryId,
    buildingId: r.buildingId,
    duplicateOf: r.duplicateOf,
    outcomeNote: r.outcomeNote?.trim() || null,
    outcomeAt: r.outcomeAt ? shortDate(r.outcomeAt) : null,
  })),
)

const emptyMessage = computed(() =>
  error.value
    ? 'De lijst is niet geladen.'
    : query.value.page > 1
      ? 'Geen dossiers op deze pagina.'
      : search.value
        ? `Niets gevonden voor “${search.value}” in ${viewLabel.value}.`
        : closedView.value
          ? 'Geen gesloten dossiers die hieraan voldoen.'
          : chips.value.length
            ? 'Niets voldoet aan deze filters.'
            : 'Niets te controleren. Alles wat binnenkwam is beoordeeld.',
)

/**
 * A search stays within its tab; only Alles reaches closed dossiers too. When
 * it finds nothing there, one click searches everything: Alles with nothing
 * but the search term, so also the archive drop Alles otherwise leaves out.
 * Not for a meldcode or a dossier id, which look everywhere already (#361).
 */
const searchElsewhere = computed(() => {
  const q = query.value.q.trim()
  if (!q || PINPOINT.test(q)) return null
  if (loading.value || error.value || rows.value.length || query.value.page > 1) return null
  if (viewKey.value !== 'alles') return 'Zoek in alles'
  return chips.value.some((c) => c.id !== 'sort') ? 'Zoek zonder filters' : null
})

function searchEverywhere() {
  push({ ...emptyQuery(), q: query.value.q }, 'alles')
}

// j / k / Enter over the rows, as on Rapportages and Herstel: the highlight
// moves, the focus follows it, Enter opens the dossier.
const { activeId, setActive } = useRowKeyboard({ rows: items, onOpen: open })

function open(row: { id: number }) {
  // The cursor goes where the row was opened: Enter on a row reached with Tab
  // means that row, not the one j/k last stood on.
  setActive(row.id)
  // The filter travels with the reviewer: the dossier page reads it to pick
  // the next one from the same list (Don, 2026-09-14).
  router.push({ name: 'review-dossier', params: { id: row.id }, query: route.query })
}

/* ------------------------------------------------------------ bulk close */

const selectedIds = ref<Set<string | number>>(new Set())
const bulkNote = ref('')
const bulkBusy = ref(false)

/**
 * A page of closed dossiers only, in a list of the desk: "Reactie ontvangen"
 * holds the melders who wrote back after their dossier was closed, and a search
 * on "Alles" finds closed ones too. Nothing on it can be selected, so the page
 * gets no checkboxes.
 */
const noneOpen = computed(() => rows.value.length > 0 && rows.value.every((r) => r.outcome))
/**
 * Checkboxes only where there is something to tick: an empty list kept its
 * select-all box in the header. The column stays while the list loads, so the
 * skeleton rows stand where the rows will.
 */
const selectable = computed(
  () => !closedView.value && !noneOpen.value && (loading.value || rows.value.length > 0),
)

/** Only an open dossier can be closed: a closed one found by a search is never part of the selection. */
function toggleRow(row: { id: number; outcome?: string | null }) {
  if (row.outcome) return
  const next = new Set(selectedIds.value)
  if (next.has(row.id)) next.delete(row.id)
  else next.add(row.id)
  selectedIds.value = next
}

function toggleAll() {
  const openIds = items.value.filter((row) => !row.outcome).map((row) => row.id)
  selectedIds.value = selectedIds.value.size === openIds.length ? new Set() : new Set(openIds)
}

const BULK_QUESTION: Record<'no_data' | 'rejected' | 'duplicate', { ask: string; confirm: string }> = {
  no_data: { ask: 'sluiten als “geen gegevens”', confirm: 'Sluiten' },
  rejected: { ask: 'afwijzen', confirm: 'Afwijzen' },
  duplicate: { ask: 'sluiten als duplicaat', confirm: 'Sluiten als duplicaat' },
}

/**
 * Close every selected dossier with one outcome. One request, one transaction:
 * the case this exists for is thirty logos in a row, and thirty sequential
 * calls is how you half-close a queue.
 *
 * It asks first. One click closed the whole selection, there is no way back,
 * and the API mails every melder who left an address.
 */
async function closeSelected(outcome: 'no_data' | 'rejected' | 'duplicate') {
  const ids = [...selectedIds.value].map(Number)
  if (!ids.length) return
  const note = bulkNote.value.trim()
  const confirmed = await confirmAction({
    title: `${ids.length} ${ids.length === 1 ? 'dossier' : 'dossiers'} ${BULK_QUESTION[outcome].ask}?`,
    body: [
      ...(note ? [`Reden: “${note}”`] : []),
      `Melders met een e-mailadres krijgen hierover een mail${note ? ', met deze reden erin' : ''}.`,
      'Dit kan niet ongedaan worden gemaakt.',
    ].join('\n'),
    confirmLabel: BULK_QUESTION[outcome].confirm,
    danger: true,
    // A yes sends mail: the keyboard starts on "Annuleren", so Enter closes nothing.
    cautious: true,
  })
  if (!confirmed) return
  bulkBusy.value = true
  try {
    await api.dataops.closeMany(ids, { outcome, note: note || null })
    selectedIds.value = new Set()
    bulkNote.value = ''
    // The sidebar's numbers too, the views under Controle included.
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
    <!-- Which view this is, and what its group holds. The views themselves are
         in the sidebar, under Controle. -->
    <div class="flex shrink-0 border-b border-line bg-surface px-6 py-3">
      <PageHeader compact class="w-full" :kicker="activeGroup.single ? 'Controle' : activeGroup.label" :title="viewLabel" :purpose="activeGroup.hint" />
    </div>

    <!-- The chips go to a next line when they do not fit: on one line they
         squeezed the search box to a stub and pushed the count out of the window. -->
    <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-6 py-2.5">
      <!-- Never narrower than its hint. -->
      <div
        class="flex max-w-[340px] min-w-[312px] flex-1 items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-1.5 focus-within:border-green focus-within:ring-2 focus-within:ring-green/30"
      >
        <span aria-hidden="true" class="text-md text-faint">⌕</span>
        <input
          v-model="search"
          type="search"
          class="studio-control"
          placeholder="Kenmerk, onderwerp, bestand, BAG-ID of e-mail"
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

      <!-- Saving what is on screen as a view of its own, listed under Controle. -->
      <button
        type="button"
        class="text-base rounded-full border border-dashed border-line-strong bg-surface px-2.5 py-[5px] whitespace-nowrap text-subtle hover:border-line-hover hover:text-strong"
        @click="onSaveView"
      >
        + Weergave opslaan
      </button>

      <!-- Not after a failed load: a count stood above "De lijst is niet geladen". -->
      <span v-if="!loadFailed" class="text-sm ml-auto font-mono text-faint">
        <template v-if="total != null">{{ total.toLocaleString('nl-NL') }} {{ total === 1 ? 'dossier' : 'dossiers' }}<template v-if="wideSearch">, ook gesloten</template></template>
        <!-- Not while the list loads: "0 rijen" stood beside the skeleton rows. -->
        <template v-else-if="!loading">{{ items.length }}{{ hasMore ? '+' : '' }} rijen</template>
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
        class="studio-input max-w-[360px] flex-1 rounded-md border border-line bg-surface px-2 py-1"
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
        :active-id="activeId"
        :selectable="selectable"
        :row-selectable="(row) => !row.outcome"
        @toggle="toggleRow"
        @toggle-all="toggleAll"
        @select="open"
      >
        <template #empty>
          {{ emptyMessage }}
          <button
            v-if="searchElsewhere"
            type="button"
            class="ml-1 font-semibold text-blue hover:underline"
            @click="searchEverywhere"
          >
            {{ searchElsewhere }} →
          </button>
        </template>
        <template #outcome="{ row }">
          <span class="flex items-center gap-1.5">
            <Pill :label="row.outcome ?? 'open'" :tone="row.outcomeTone" plain />
            <span v-if="row.inquiryId" class="text-sm font-mono text-faint">#{{ row.inquiryId }}</span>
            <span v-else-if="row.duplicateOf" class="text-sm font-mono text-faint">van {{ row.duplicateOf }}</span>
          </span>
        </template>
        <template #outcomeNote="{ row }">
          <span v-if="row.outcomeNote" class="text-base line-clamp-2 whitespace-normal text-muted" :title="row.outcomeNote">
            {{ row.outcomeNote }}
          </span>
          <span v-else class="text-base text-faint">—</span>
        </template>
        <template #outcomeAt="{ row }">
          <span class="text-muted">{{ row.outcomeAt ?? '—' }}</span>
        </template>
        <!-- A link inside a clickable row: .stop, or the row opens the dossier as well. -->
        <template #pand="{ row }">
          <RouterLink
            v-if="row.buildingId"
            :to="{ name: 'building', params: { id: row.buildingId } }"
            class="text-sm text-blue-ink hover:underline"
            :aria-label="`Pand van ${row.reference}`"
            @click.stop
          >
            pand
          </RouterLink>
          <span v-else class="text-sm text-faint" title="Nog geen pand bij dit dossier">—</span>
        </template>
        <template #reference="{ row }">
          <span class="text-sm font-mono text-faint" :title="row.reference">{{ row.reference }}</span>
        </template>
        <template #subject="{ row }">
          <span class="text-lg font-semibold text-body" :title="row.subject">{{ row.subject }}</span>
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
          <!-- A closed dossier in a list of the desk says how it was closed:
               it looked open, down to "niets gevonden" and a number of proposals. -->
          <span v-if="row.outcome" class="flex justify-end">
            <Pill :label="row.outcome" :tone="row.outcomeTone" plain />
          </span>
          <!-- Don, 2026-10-02: a melding without a file was "nog niet gelezen"
               for ever, which read as a stuck pipeline. There is nothing to read. -->
          <span v-else-if="row.files === 0" class="flex justify-end">
            <Pill label="geen document" tone="neutral" plain />
          </span>
          <span v-else-if="!row.read" class="flex justify-end">
            <Pill label="nog niet gelezen" tone="amber" plain />
          </span>
          <span v-else-if="row.open === 0" class="flex justify-end">
            <Pill label="niets gevonden" tone="red" plain />
          </span>
          <span v-else class="font-mono tabular-nums text-strong">{{ row.open }}</span>
        </template>
        <template #receivedAt="{ row }">
          <!-- A name too long for the column goes to a second line instead of being cut. -->
          <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="text-muted">{{ row.receivedAt }}</span>
            <Pill v-if="row.overdue" label="te lang open" tone="amber" plain />
            <Pill v-if="row.assignedName" :label="`bij ${row.assignedName}`" tone="blue" plain />
          </span>
        </template>

        <template #footer>
          <span class="text-base text-subtle">
            Pagina {{ page }}<template v-if="!loading && !loadFailed"> · {{ items.length }} op deze pagina</template>
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
