<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { RouterLink } from 'vue-router'

import Panel from '@/components/Common/Panel.vue'

import api from '@/services/fundermaps'
import type { IReviewQueueItem } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { toastError } from '@/services/toast'
import { BUILTIN_VIEWS, emptyQuery, toRouteQuery } from '@/services/reviewExplorer'
import {
  PACKAGE_PREVIEW,
  WORK_PACKAGES,
  effectivePackageIds,
  packagesFor,
  saveChosen,
  type WorkPackage,
} from '@/services/workPackages'
import { useStudioStore } from '@/stores/studio'
import { formatRelative } from '@/utils/date'

/**
 * Your part of the review queue, on the page Studio opens on.
 *
 * Each package is one filtered slice, oldest first, with its exact count;
 * "alles bekijken" opens that same slice in Beoordelen. The packages are the
 * ones the admin composed for you or, when there are none, the ones you ticked
 * in this browser. Either way the same dossier can sit in someone else's too.
 * See services/workPackages.ts.
 */

const studio = useStudioStore()

const chosen = ref<string[]>([])
/** The admin composed this set: shown as such, and not yours to change here. */
const assigned = ref(false)
const choosing = ref(false)
const draft = ref<string[]>([])

const loading = ref(false)
const rows = ref<Record<string, IReviewQueueItem[]>>({})
/** `null` = the count did not come back; show what was fetched instead of inventing a number. */
const counts = ref<Record<string, number | null>>({})

const mine = computed(() => packagesFor(chosen.value))

/**
 * Dossiers a colleague handed to you. The number next to "Vandaag" counts
 * them (stores/studio.ts), so this page lists them: without it the sidebar
 * said more than the page showed. Only there when there are any.
 */
const handedRows = ref<IReviewQueueItem[]>([])
const handedCount = ref<number | null>(null)
const handedTotal = computed(() => handedCount.value ?? handedRows.value.length)

async function loadHanded() {
  const [list, count] = await Promise.all([
    api.dataops.queue({ assignedTo: 'me', limit: PACKAGE_PREVIEW }).catch(() => [] as IReviewQueueItem[]),
    api.dataops
      .queueCount({ assignedTo: 'me' })
      .then((r) => r.count as number | null)
      .catch(() => null),
  ])
  handedRows.value = list
  handedCount.value = count
}

async function load() {
  void loadHanded()
  if (!mine.value.length) return
  loading.value = true
  try {
    // Each package is independent: one failing must not blank the others.
    const results = await Promise.all(
      mine.value.map(async (p) => {
        const [list, count] = await Promise.all([
          api.dataops.queue({ ...p.opts, limit: PACKAGE_PREVIEW }).catch(() => [] as IReviewQueueItem[]),
          api.dataops
            .queueCount(p.opts)
            .then((r) => r.count as number | null)
            .catch(() => null),
        ])
        return [p.id, list, count] as const
      }),
    )
    rows.value = Object.fromEntries(results.map(([id, list]) => [id, list]))
    counts.value = Object.fromEntries(results.map(([id, , count]) => [id, count]))
  } catch (e) {
    toastError(describeFailure(e, 'Je werkpakketten konden niet worden geladen.'))
  } finally {
    loading.value = false
  }
}

onBeforeMount(async () => {
  // The admin's set first, so someone who has one never sees the chooser
  // flash open. No set, or an API without the endpoint: the browser's own
  // choice, exactly as before.
  const effective = await effectivePackageIds()
  chosen.value = effective.ids
  assigned.value = effective.assigned
  // Nothing picked yet: open the chooser straight away rather than show an
  // empty section that says nothing.
  if (!assigned.value && !chosen.value.length) startChoosing()
  load()
})

function startChoosing() {
  draft.value = [...chosen.value]
  choosing.value = true
}

function toggle(id: string) {
  draft.value = draft.value.includes(id) ? draft.value.filter((x) => x !== id) : [...draft.value, id]
}

function saveChoice() {
  chosen.value = [...draft.value]
  saveChosen(chosen.value)
  // Back to none is a choice too (it could not be saved before). The chooser
  // then stays open, as on a first visit: closed, there would be nothing to reopen it with.
  choosing.value = chosen.value.length === 0
  load()
  // The sidebar number is the sum of these packages; keep it in step.
  void studio.refreshCounts(null)
}

const total = (p: WorkPackage) => counts.value[p.id] ?? rows.value[p.id]?.length ?? 0

/**
 * The tab a package opens on: the first one asking for the same channel and
 * state. A search on "Alles" also finds closed dossiers (isWideSearch), so a
 * package with a search term showed 117 instead of its 6 open ones (Don,
 * 2026-10-20). Its own tab keeps it to open dossiers. Since the groups
 * (2026-10-22) every package has one; Alles is the fallback.
 */
const sameSet = (a: readonly string[] = [], b: readonly string[] = []) =>
  a.length === b.length && a.every((x) => b.includes(x))

function packageView(p: WorkPackage): string {
  const view = BUILTIN_VIEWS.find(
    (v) =>
      sameSet(v.query.channel, p.opts.channel) &&
      sameSet(v.query.state, p.opts.state) &&
      !v.query.outcome?.length &&
      !v.query.mine,
  )
  return view?.key ?? 'alles'
}

/** The package opened in Beoordelen, through the queue's own URL format. */
function queueLink(p: WorkPackage) {
  const q = emptyQuery()
  if (p.opts.channel) q.channel = [...p.opts.channel]
  if (p.opts.state) q.state = [...p.opts.state]
  if (p.opts.kind) q.kind = [...p.opts.kind]
  if (p.opts.q) q.q = p.opts.q
  return { name: 'review-queue', query: toRouteQuery(q, packageView(p)) }
}

/**
 * What the page shows, one panel each: your packages, then what was handed to
 * you. While the chooser is open the packages are being picked, so only the
 * handed-over dossiers stay: they are yours whatever you tick.
 */
const panels = computed(() => [
  ...(choosing.value ? [] : mine.value).map((p) => ({ id: p.id, title: p.title, rows: rows.value[p.id] ?? [], total: total(p), link: queueLink(p), busy: loading.value })),
  ...(handedTotal.value > 0
    ? [
        {
          id: 'handed-to-me',
          title: 'Aan jou toegewezen',
          rows: handedRows.value,
          total: handedTotal.value,
          link: { name: 'review-queue', query: toRouteQuery({ ...emptyQuery(), mine: true }, 'mij') },
          busy: false,
        },
      ]
    : []),
])
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-baseline gap-3">
      <h2 class="text-2xl font-display font-bold text-ink">Jouw werk</h2>
      <button
        v-if="!choosing && !assigned && chosen.length"
        type="button"
        class="text-sm font-semibold text-blue hover:underline"
        @click="startChoosing"
      >
        Pakketten wijzigen
      </button>
    </div>
    <p v-if="assigned" class="text-base text-muted">
      Je werkpakketten zijn klaargezet door de beheerder.
    </p>

    <!-- The chooser. Ticked once, remembered in this browser. -->
    <Panel v-if="choosing">
      <template #header>
        <span class="text-lg font-bold text-strong">Welk werk is van jou?</span>
      </template>
      <p class="text-base text-muted mb-3">
        Vink de pakketten aan die je oppakt. Je kunt er meer kiezen. Studio onthoudt het op deze
        computer.
      </p>
      <div class="grid grid-cols-2 gap-2">
        <label
          v-for="p in WORK_PACKAGES"
          :key="p.id"
          class="flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2"
          :class="draft.includes(p.id) ? 'border-green-border bg-green-wash' : 'border-line bg-surface'"
        >
          <input
            :id="`pakket-${p.id}`"
            type="checkbox"
            class="mt-1 accent-green"
            :checked="draft.includes(p.id)"
            @change="toggle(p.id)"
          />
          <span class="min-w-0">
            <span class="block text-base font-semibold text-body">{{ p.title }}</span>
            <span class="block text-sm text-subtle">{{ p.hint }}</span>
          </span>
        </label>
      </div>
      <div class="mt-3 flex items-center gap-3">
        <button
          type="button"
          class="text-md h-8 rounded-lg bg-green px-3 font-semibold text-white disabled:opacity-50"
          :disabled="!draft.length && !chosen.length"
          @click="saveChoice"
        >
          Opslaan
        </button>
        <button
          v-if="chosen.length"
          type="button"
          class="text-md h-8 rounded-lg px-3 font-semibold text-subtle hover:text-strong"
          @click="choosing = false"
        >
          Annuleren
        </button>
      </div>
    </Panel>

    <!-- One panel per package, oldest work first. -->
    <div v-if="panels.length" class="grid grid-cols-2 gap-3">
      <Panel v-for="p in panels" :key="p.id" flush>
        <template #header>
          <span class="text-lg font-bold text-strong">{{ p.title }}</span>
          <span class="text-sm rounded-sm bg-green-tint px-1.5 py-px font-mono text-green-ink">
            {{ p.busy ? '…' : p.total.toLocaleString('nl-NL') }}
          </span>
        </template>

        <ul v-if="p.rows.length" class="divide-y divide-divider">
          <li v-for="r in p.rows" :key="r.id">
            <RouterLink
              :to="{ name: 'review-dossier', params: { id: r.id } }"
              class="flex items-baseline gap-3 px-4 py-2 hover:bg-canvas focus-visible:-outline-offset-2"
            >
              <span class="text-sm font-mono text-faint shrink-0">{{ r.reference ?? `#${r.id}` }}</span>
              <span class="text-base text-body min-w-0 truncate">{{ r.subject ?? 'Zonder omschrijving' }}</span>
              <span class="text-sm text-subtle ml-auto shrink-0">{{ formatRelative(r.receivedAt) }}</span>
            </RouterLink>
          </li>
        </ul>
        <p v-else-if="!p.busy" class="px-4 py-3 text-base text-subtle">Niets open. Mooi zo.</p>

        <div v-if="p.total > p.rows.length" class="border-t border-divider px-4 py-2">
          <RouterLink :to="p.link" class="text-base font-semibold text-blue hover:underline">
            Alle {{ p.total.toLocaleString('nl-NL') }} bekijken in Controle →
          </RouterLink>
        </div>
      </Panel>
    </div>
  </section>
</template>
