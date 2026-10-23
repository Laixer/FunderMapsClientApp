<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppShell from '@/components/Layout/AppShell.vue'
import Callout from '@/components/Common/Callout.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import KpiTile from '@/components/Common/KpiTile.vue'
import PageHeader from '@/components/Common/PageHeader.vue'
import Segmented from '@/components/Common/Segmented.vue'
import Panel from '@/components/Common/Panel.vue'
import ProgressBar from '@/components/Common/ProgressBar.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import StudioDay from '@/components/Home/StudioDay.vue'
import WorkPackages from '@/components/Home/WorkPackages.vue'
import PackageOverview from '@/components/Home/PackageOverview.vue'
import TeamPanel from '@/components/Home/TeamPanel.vue'
import WorkPackageAdmin from '@/components/Home/WorkPackageAdmin.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import { describeFailure } from '@/services/fundermaps/errors'
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import { recents, type RecentEntry } from '@/services/recents'
import { toastError } from '@/services/toast'
import type { Tone } from '@/services/tone'
import { formatDateShort, formatRelative } from '@/utils/date'
import {
  LANES,
  LANE_FETCH,
  LANE_PREVIEW,
  laneCountLabel,
  laneCountQuery,
  laneQuery,
} from '@/services/worklist'
import { useRowKeyboard } from '@/services/useRowKeyboard'
import { useSessionStore } from '@/stores/session'
import { useStudioStore } from '@/stores/studio'

/**
 * Vandaag: your part of the work, not the archive. (Called the Werkbank
 * until 2026-09-22 — Yorick: "tis geen jaren 80".)
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
const { currentUser, isAdministrator } = storeToRefs(useSessionStore())
const studio = useStudioStore()
const { werkbank } = storeToRefs(studio)

const loading = ref(true)
const rowsByLane = ref<Record<string, IInquiry[]>>({})
/**
 * Exact lane totals from `/inquiry/stats`. `null` means the count did not
 * come back, and the lane falls back to the capped "50+" floor — a lane must
 * never show a number the data cannot support.
 */
const countByLane = ref<Record<string, number | null>>({})
const archiveTotal = ref<number | null>(null)
/** The archive count is asked after the lanes, so its tile waits on its own. */
const archiveLoading = ref(true)
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
    // not useful until all of them have answered. The exact counts ride along
    // but may each fail on their own — rows without a count is a working page,
    // a count without rows is not.
    const [results, counts] = await Promise.all([
      Promise.all(LANES.map((lane) => api.inquiry.list(laneQuery(lane, me)))),
      Promise.all(
        LANES.map((lane) =>
          api.inquiry
            .getCount(laneCountQuery(lane, me))
            .then(({ count }) => count as number | null)
            .catch(() => null),
        ),
      ),
    ])
    rowsByLane.value = Object.fromEntries(LANES.map((lane, i) => [lane.key, results[i]!]))
    countByLane.value = Object.fromEntries(LANES.map((lane, i) => [lane.key, counts[i]!]))
  } catch (e) {
    toastError(describeFailure(e, 'Vandaag kon niet worden geladen.'))
  } finally {
    loading.value = false
  }

  // The archive total is context, not the subject — a page that fails because
  // `/inquiry/stats` was slow would be a bad trade.
  try {
    archiveTotal.value = (await api.inquiry.getCount()).count
  } catch {
    archiveTotal.value = null
  } finally {
    archiveLoading.value = false
  }
}

onBeforeMount(() => {
  recentlyOpened.value = recents()
  load()
})

// The session restores asynchronously on a cold load, so the user id can land
// after this view has mounted.
watch(currentUser, load)

/** Best available number per lane: the exact count, or the fetched rows. */
function laneTotal(key: string): number {
  return countByLane.value[key] ?? rowsByLane.value[key]?.length ?? 0
}

/** The badge/tile text: exact when `/inquiry/stats` answered, "50+" when not. */
function laneCount(key: string, rows: readonly unknown[]): string {
  const exact = countByLane.value[key]
  return exact != null ? exact.toLocaleString('nl-NL') : laneCountLabel(rows)
}

/** The three rapportage lanes together: what the rail's bars are a share of. */
const lanesTotal = computed(() => LANES.reduce((n, lane) => n + laneTotal(lane.key), 0))

/**
 * The line under "Vandaag" says the number the sidebar shows next to it: your
 * work packages plus what was handed to you (stores/studio.ts). It summed the
 * rapportage lanes below until 2026-10-12, so after the sidebar moved to the
 * packages the two numbers on one screen disagreed (49 here, 16 there). The
 * lanes keep their own counts on their tiles.
 */
/**
 * The studio's day, from the store's pulse (the top bar reads the same): fresh
 * on arrival here, one request. The page works without it (an API without
 * /dataops/today, or a failure).
 */
const studioDay = computed(() => studio.pulse)
onBeforeMount(() => void studio.refreshPulse(0))

/** "donderdag 22 oktober": the page is about one day; it says which. */
const today = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

const subtitle = computed(() => {
  if (loading.value || werkbank.value == null) return 'Je werk wordt opgehaald…'
  const archive =
    archiveTotal.value == null
      ? ''
      : ` · ${archiveTotal.value.toLocaleString('nl-NL')} dossiers in het archief`
  if (werkbank.value === 0) return `Niets op je bord. Mooi zo.${archive}`
  const dossiers = werkbank.value === 1 ? 'dossier wacht' : 'dossiers wachten'
  return `${werkbank.value.toLocaleString('nl-NL')} ${dossiers} op jou${archive}`
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
    value: laneCount('review', reviewLane.value),
    caption: reviewLane.value.length ? 'wacht op jouw oordeel' : 'niets open',
    tone: 'blue',
    query: { view: 'te-controleren' },
  },
  {
    key: 'rejected',
    label: 'AFGEKEURD',
    value: laneCount('rejected', rejectedLane.value),
    caption: rejectedLane.value.length ? 'kwam terug naar jou' : 'niets open',
    tone: 'red',
    query: { view: 'afgekeurd' },
  },
  {
    key: 'entry',
    label: 'JOUW INVOER',
    value: laneCount('entry', entryLane.value),
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
  { field: 'type', title: 'Soort', width: '150px' },
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
  const total = lanesTotal.value || 1
  return [
    { label: 'Te controleren', count: laneTotal('review'), tone: 'blue' as Tone },
    { label: 'Jouw invoer', count: laneTotal('entry'), tone: 'amber' as Tone },
    { label: 'Afgekeurd', count: laneTotal('rejected'), tone: 'red' as Tone },
  ].map((row) => ({ ...row, value: row.count / total }))
})

function chipActive(types: number[] | null): boolean {
  return (typeFilter.value?.join() ?? '') === (types?.join() ?? '')
}
</script>

<template>
  <AppShell crumb="Vandaag">
    <div class="flex flex-col gap-4.5 px-6 py-6">
      <PageHeader :kicker="today" title="Vandaag" :purpose="subtitle" />

      <!-- The day as the pipeline lived it, first (2026-10-22): most of the work is the machines' now. -->
      <StudioDay v-if="studioDay" :data="studioDay" />

      <!-- The review queue, cut to what this person picked (#Vandaag, Don
           2026-09-22). First, because it is where the day's work is now;
           the lanes below are the older typed-in route. -->
      <WorkPackages />

      <!-- The admin hands the packages out per colleague (2026-10-09). -->
      <WorkPackageAdmin v-if="isAdministrator" />

      <!-- Who did what, last 30 days (2026-10-23): administrators only, as decided; was Grafana's "Operations". -->
      <TeamPanel v-if="isAdministrator" />

      <!-- Every package over its last 30 days (2026-10-23): where work piles up and
           where it moves. Was the Grafana board "Operations". -->
      <PackageOverview />

      <div class="grid grid-cols-4 gap-3">
        <KpiTile
          v-for="tile in tiles"
          :key="tile.key"
          :label="tile.label"
          :value="tile.value"
          :caption="tile.caption"
          :tone="tile.tone"
          :loading="tile.key === 'archive' ? archiveLoading : loading"
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
              {{ loading ? '…' : laneCount('review', reviewLane) }}
            </span>
          </template>

          <template #actions>
            <Segmented
              :model-value="TYPE_CHIPS.find((c) => chipActive(c.types))?.label ?? ''"
              label="Soort rapportage"
              :options="TYPE_CHIPS.map((c) => ({ key: c.label, label: c.label }))"
              @update:model-value="typeFilter = TYPE_CHIPS.find((c) => c.label === $event)?.types ?? null"
            />
          </template>

          <DataTable
            :rows="queue"
            :columns="COLUMNS"
            :loading="loading"
            :active-id="activeId"
            empty-message="Niets te controleren. Mooi zo."
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
                {{ typeFilter ? filteredReview.length : laneCount('review', reviewLane) }} zichtbaar
                <!-- Only without an exact count is the capped fetch a floor
                     rather than a fact. Say so instead of implying it. -->
                <template
                  v-if="
                    !typeFilter && countByLane.review == null && reviewLane.length >= LANE_FETCH
                  "
                >
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
          <Panel caption="JOUW RAPPORTAGES">
            <EmptyState v-if="loading">Laden…</EmptyState>
            <div v-else-if="lanesTotal" class="flex flex-col gap-2.5">
              <div v-for="row in distribution" :key="row.label" class="flex flex-col gap-1.5">
                <p class="text-base flex text-muted">
                  <span>{{ row.label }}</span>
                  <span class="ml-auto font-mono text-strong">{{ row.count.toLocaleString('nl-NL') }}</span>
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
