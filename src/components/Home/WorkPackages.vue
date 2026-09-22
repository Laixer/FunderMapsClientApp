<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { RouterLink } from 'vue-router'

import Panel from '@/components/Common/Panel.vue'

import api from '@/services/fundermaps'
import type { IReviewQueueItem } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { toastError } from '@/services/toast'
import { emptyQuery, toRouteQuery } from '@/services/reviewExplorer'
import {
  PACKAGE_PREVIEW,
  WORK_PACKAGES,
  loadChosen,
  packagesFor,
  saveChosen,
  type WorkPackage,
} from '@/services/workPackages'
import { formatRelative } from '@/utils/date'

/**
 * Your part of the review queue, on the page Studio opens on.
 *
 * Each ticked package is one filtered slice, oldest first, with its exact
 * count; "alles bekijken" opens that same slice in Beoordelen. Nothing here is
 * assigned to you by the system — the packages are what you picked, and the
 * same dossier can sit in someone else's too. See services/workPackages.ts.
 */

const chosen = ref<string[]>([])
const choosing = ref(false)
const draft = ref<string[]>([])

const loading = ref(false)
const rows = ref<Record<string, IReviewQueueItem[]>>({})
/** `null` = the count did not come back; show what was fetched instead of inventing a number. */
const counts = ref<Record<string, number | null>>({})

const mine = computed(() => packagesFor(chosen.value))

async function load() {
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

onBeforeMount(() => {
  chosen.value = loadChosen()
  // Nothing picked yet: open the chooser straight away rather than show an
  // empty section that says nothing.
  if (!chosen.value.length) startChoosing()
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
  choosing.value = false
  load()
}

const total = (p: WorkPackage) => counts.value[p.id] ?? rows.value[p.id]?.length ?? 0

/** The package opened in Beoordelen, through the queue's own URL format. */
function queueLink(p: WorkPackage) {
  const q = emptyQuery()
  if (p.opts.channel) q.channel = [...p.opts.channel]
  if (p.opts.state) q.state = [...p.opts.state]
  if (p.opts.kind) q.kind = [...p.opts.kind]
  if (p.opts.q) q.q = p.opts.q
  return { name: 'review-queue', query: toRouteQuery(q, 'alles') }
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-baseline gap-3">
      <h2 class="text-2xl font-display font-bold text-ink">Jouw werk</h2>
      <button
        v-if="!choosing && chosen.length"
        type="button"
        class="text-sm font-semibold text-blue hover:underline"
        @click="startChoosing"
      >
        Pakketten wijzigen
      </button>
    </div>

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
          :disabled="!draft.length"
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
    <div v-else-if="mine.length" class="grid grid-cols-2 gap-3">
      <Panel v-for="p in mine" :key="p.id" flush>
        <template #header>
          <span class="text-lg font-bold text-strong">{{ p.title }}</span>
          <span class="text-sm rounded-sm bg-green-tint px-1.5 py-px font-mono text-green-ink">
            {{ loading ? '…' : total(p) }}
          </span>
        </template>

        <ul v-if="rows[p.id]?.length" class="divide-y divide-divider">
          <li v-for="r in rows[p.id]" :key="r.id">
            <RouterLink
              :to="{ name: 'review-dossier', params: { id: r.id } }"
              class="flex items-baseline gap-3 px-4 py-2 hover:bg-canvas"
            >
              <span class="text-sm font-mono text-faint shrink-0">{{ r.reference ?? `#${r.id}` }}</span>
              <span class="text-base text-body min-w-0 truncate">{{ r.subject ?? 'Zonder omschrijving' }}</span>
              <span class="text-sm text-subtle ml-auto shrink-0">{{ formatRelative(r.receivedAt) }}</span>
            </RouterLink>
          </li>
        </ul>
        <p v-else-if="!loading" class="px-4 py-3 text-base text-subtle">Niets open. Mooi zo.</p>

        <div
          v-if="total(p) > (rows[p.id]?.length ?? 0)"
          class="border-t border-divider px-4 py-2"
        >
          <RouterLink :to="queueLink(p)" class="text-base font-semibold text-blue hover:underline">
            Alle {{ total(p) }} bekijken in Beoordelen →
          </RouterLink>
        </div>
      </Panel>
    </div>
  </section>
</template>
