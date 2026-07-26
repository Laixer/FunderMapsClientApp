<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppShell from '@/components/Layout/AppShell.vue'
import Callout from '@/components/Common/Callout.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import KpiTile from '@/components/Common/KpiTile.vue'
import Panel from '@/components/Common/Panel.vue'
import ProgressBar from '@/components/Common/ProgressBar.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import { describeFailure } from '@/services/fundermaps/errors'
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import { recents, type RecentEntry } from '@/services/recents'
import { toastError } from '@/services/toast'
import type { Tone } from '@/services/tone'
import { formatDateShort, formatRelative } from '@/utils/date'
import { LANES, LANE_FETCH, LANE_PREVIEW, laneCountLabel, laneQuery } from '@/services/worklist'
import { useRowKeyboard } from '@/services/useRowKeyboard'
import { useSessionStore } from '@/stores/session'

/**
 * The Werkbank: your bench, not the archive.
 *
 * `/` used to open the inquiry list — the 200 most recently touched dossiers
 * across the whole organisation, which at 26k rows and 20k of them sitting in
 * `pending_review` is a filing cabinet rather than a desk. This page answers
 * one question instead: what is waiting on *you*, and what to do next.
 *
 * Everything on it is counted, never estimated. The tiles are three real lane
 * queries plus the archive total; the distribution bars are those same three
 * counts drawn to scale. There is no throughput chart and no average lead time,
 * because `update_date` was bulk-stamped by two migrations and is wrong for
 * four rows in five (see `services/pipeline.ts`) — a plausible number here
 * would be worse than no number at all.
 */
const router = useRouter()
const { currentUser } = storeToRefs(useSessionStore())

const loading = ref(true)
const rowsByLane = ref<Record<string, IInquiry[]>>({})
const archiveTotal = ref<number | null>(null)
const recentlyOpened: Ref<RecentEntry[]> = ref([])

/** Which type chip is narrowing the queue. `null` is "Alles". */
const typeFilter = ref<number[] | null>(null)

const reviewLane = computed(() => rowsByLane.value.review ?? [])
const rejectedLane = computed(() => rowsByLane.value.rejected ?? [])
const entryLane = computed(() => rowsByLane.value.entry ?? [])

async function load() {
  const me = currentUser.value?.id
  if (!me) return
  try {
    loading.value = true
    // One request per lane, in parallel: independent queries, and the page is
    // not useful until all of them have answered.
    const results = await Promise.all(LANES.map((lane) => api.inquiry.list(laneQuery(lane, me))))
    rowsByLane.value = Object.fromEntries(LANES.map((lane, i) => [lane.key, results[i]!]))
  } catch (e) {
    toastError(describeFailure(e, 'De werkbank kon niet worden geladen.'))
  } finally {
    loading.value = false
  }

  // The archive total is context, not the subject — a page that fails because
  // `/inquiry/stats` was slow would be a bad trade.
  try {
    archiveTotal.value = (await api.inquiry.getCount()).count
  } catch {
    archiveTotal.value = null
  }
}

onBeforeMount(() => {
  recentlyOpened.value = recents()
  load()
})

// The session restores asynchronously on a cold load, so the user id can land
// after this view has mounted.
watch(currentUser, load)

const waitingOnMe = computed(
  () => reviewLane.value.length + rejectedLane.value.length + entryLane.value.length,
)

const subtitle = computed(() => {
  if (loading.value) return 'Je werk wordt opgehaald…'
  const archive =
    archiveTotal.value == null
      ? ''
      : ` · ${archiveTotal.value.toLocaleString('nl-NL')} dossiers in het archief`
  if (waitingOnMe.value === 0) return `Niks op je bord. Mooi zo.${archive}`
  const dossiers = waitingOnMe.value === 1 ? 'dossier wacht' : 'dossiers wachten'
  return `${waitingOnMe.value} ${dossiers} op jou${archive}`
})

/* ---------------------------------------------------------------- the tiles */

interface Tile {
  key: string
  label: string
  value: string
  caption: string
  tone: Tone
  query: Record<string, string>
}

const tiles = computed<Tile[]>(() => [
  {
    key: 'review',
    label: 'TE CONTROLEREN',
    value: laneCountLabel(reviewLane.value),
    caption: reviewLane.value.length ? 'wacht op jouw oordeel' : 'niets open',
    tone: 'blue',
    query: { view: 'te-controleren' },
  },
  {
    key: 'rejected',
    label: 'AFGEKEURD',
    value: laneCountLabel(rejectedLane.value),
    caption: rejectedLane.value.length ? 'kwam terug naar jou' : 'niets open',
    tone: 'red',
    query: { view: 'afgekeurd' },
  },
  {
    key: 'entry',
    label: 'JOUW INVOER',
    value: laneCountLabel(entryLane.value),
    caption: entryLane.value.length ? 'nog niet aangeboden' : 'niets open',
    tone: 'amber',
    query: { view: 'mijn-invoer' },
  },
  {
    key: 'archive',
    label: 'ARCHIEF',
    value: archiveTotal.value == null ? '—' : archiveTotal.value.toLocaleString('nl-NL'),
    caption: 'dossiers in FunderMaps',
    tone: 'green',
    query: { view: 'alles' },
  },
])

/* ---------------------------------------------------------------- the queue */

/**
 * The type chips over the queue. Grouped rather than one chip per enum value:
 * there are fifteen inquiry types, and three of them account for nearly
 * everything anyone reviews.
 */
const TYPE_CHIPS: { label: string; types: number[] | null }[] = [
  { label: 'Alles', types: null },
  { label: 'QuickScan', types: [3, 14] },
  { label: 'Archief', types: [7] },
  { label: 'Notitie', types: [2] },
]

const filteredReview = computed(() =>
  typeFilter.value
    ? reviewLane.value.filter((row) => row.type !== null && typeFilter.value!.includes(row.type))
    : reviewLane.value,
)

const queue = computed(() => filteredReview.value.slice(0, LANE_PREVIEW))

const COLUMNS: DataColumn[] = [
  { field: 'id', title: 'ID', width: '78px' },
  { field: 'documentName', title: 'Naam', width: 'minmax(0,1fr)' },
  { field: 'type', title: 'Type', width: '150px' },
  { field: 'documentDate', title: 'Datum', width: '96px' },
  { field: 'status', title: 'Status', width: '116px' },
]

function open(row: IInquiry) {
  router.push({ name: 'inquiry-view', params: { id: row.id } })
}

// j / k / Enter over the queue — see services/useRowKeyboard.ts.
const { activeId } = useRowKeyboard({ rows: queue, onOpen: open })

/* ----------------------------------------------------------------- the rail */

/**
 * How your work splits across the three lanes, as a share of your total. Not a
 * trend — three counts we have, drawn to scale.
 */
const distribution = computed(() => {
  const total = waitingOnMe.value || 1
  return [
    { label: 'Te controleren', count: reviewLane.value.length, tone: 'blue' as Tone },
    { label: 'Jouw invoer', count: entryLane.value.length, tone: 'amber' as Tone },
    { label: 'Afgekeurd', count: rejectedLane.value.length, tone: 'red' as Tone },
  ].map((row) => ({ ...row, value: row.count / total }))
})

function chipActive(types: number[] | null): boolean {
  return (typeFilter.value?.join() ?? '') === (types?.join() ?? '')
}
</script>

<template>
  <AppShell crumb="Werkbank">
    <div class="flex flex-col gap-4.5 px-6 py-6">
      <header>
        <h1 class="text-5xl font-display font-bold text-ink">Werkbank</h1>
        <p class="text-xl mt-1 text-muted">{{ subtitle }}</p>
      </header>

      <div class="grid grid-cols-4 gap-3">
        <KpiTile
          v-for="tile in tiles"
          :key="tile.key"
          :label="tile.label"
          :value="tile.value"
          :caption="tile.caption"
          :tone="tile.tone"
          :loading="loading && tile.key !== 'archive'"
          @click="router.push({ name: 'inquiry-list', query: tile.query })"
        />
      </div>

      <!-- A dossier that came back is the one thing on this page that is not
           routine, so it is said in words above the queue rather than left to a
           tile you might not read. -->
      <Callout
        v-if="!loading && rejectedLane.length"
        tone="red"
        :title="`${rejectedLane.length} ${rejectedLane.length === 1 ? 'dossier kwam' : 'dossiers kwamen'} terug van de controle`"
      >
        De beoordelaar heeft om aanpassingen gevraagd. De reden staat in de tijdlijn van het
        dossier.
        <template #action>
          <RouterLink
            :to="{ name: 'inquiry-list', query: { view: 'afgekeurd' } }"
            class="text-md inline-flex h-8 items-center rounded-lg border border-red-border bg-surface px-3 font-semibold text-red hover:bg-red-wash"
          >
            Bekijken
          </RouterLink>
        </template>
      </Callout>

      <div class="grid grid-cols-[minmax(0,1fr)_var(--spacing-rail)] items-start gap-4">
        <Panel flush>
          <template #header>
            <span class="text-lg font-bold text-strong">Te controleren door jou</span>
            <span class="text-sm rounded-sm bg-green-tint px-1.5 py-px font-mono text-green-ink">
              {{ laneCountLabel(reviewLane) }}
            </span>
          </template>

          <template #actions>
            <button
              v-for="chip in TYPE_CHIPS"
              :key="chip.label"
              type="button"
              class="text-sm rounded-md border px-2.5 py-1 font-semibold"
              :class="
                chipActive(chip.types)
                  ? 'border-line bg-canvas text-strong'
                  : 'border-line bg-surface text-subtle hover:border-line-hover'
              "
              @click="typeFilter = chip.types"
            >
              {{ chip.label }}
            </button>
          </template>

          <DataTable
            :rows="queue"
            :columns="COLUMNS"
            :loading="loading"
            :active-id="activeId"
            empty-message="Niks te controleren. Mooi zo."
            @select="open"
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
            <template #status="{ row }">
              <StatusBadge :status="row.state?.auditStatus" />
            </template>

            <template v-if="filteredReview.length" #footer>
              <span class="text-base text-subtle">
                {{ queue.length }} van
                {{ typeFilter ? filteredReview.length : laneCountLabel(reviewLane) }} zichtbaar
                <!-- The lane query is capped, so past the cap the count is a
                     floor rather than a fact. Say so instead of implying it. -->
                <template v-if="!typeFilter && reviewLane.length >= LANE_FETCH">
                  — mogelijk meer
                </template>
              </span>
              <RouterLink
                :to="{ name: 'inquiry-list', query: { view: 'te-controleren' } }"
                class="text-base ml-auto font-semibold text-blue hover:underline"
              >
                Alles openen in Rapportages →
              </RouterLink>
            </template>
          </DataTable>
        </Panel>

        <aside class="flex flex-col gap-4">
          <Panel caption="JOUW WERK">
            <div v-if="waitingOnMe" class="flex flex-col gap-2.5">
              <div v-for="row in distribution" :key="row.label" class="flex flex-col gap-1.5">
                <p class="text-base flex text-muted">
                  <span>{{ row.label }}</span>
                  <span class="ml-auto font-mono text-strong">{{ row.count }}</span>
                </p>
                <ProgressBar :value="row.value" :tone="row.tone" size="md" :label="row.label" />
              </div>
            </div>
            <EmptyState v-else>Geen openstaand werk.</EmptyState>
          </Panel>

          <Panel caption="RECENT GEOPEND">
            <ul v-if="recentlyOpened.length" class="flex flex-col">
              <li v-for="entry in recentlyOpened" :key="`${entry.kind}-${entry.id}`">
                <RouterLink
                  :to="{
                    name: entry.kind === 'inquiry' ? 'inquiry-view' : 'recovery-view',
                    params: { id: entry.id },
                  }"
                  class="-mx-2 flex items-baseline gap-2 rounded-lg px-2 py-1.5 hover:bg-canvas"
                >
                  <span class="text-md min-w-0 flex-1 truncate text-body">{{ entry.label }}</span>
                  <span class="text-xs shrink-0 font-mono text-label">
                    {{ formatRelative(entry.at) }}
                  </span>
                </RouterLink>
              </li>
            </ul>
            <EmptyState v-else>Nog niets geopend.</EmptyState>
          </Panel>
        </aside>
      </div>
    </div>
  </AppShell>
</template>
