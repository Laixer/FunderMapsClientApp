<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import DataTable, { type DataColumn } from '@/components/Common/DataTable.vue'
import Pill from '@/components/Common/Pill.vue'
import api from '@/services/fundermaps'
import type { IReviewQueueItem } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { PAGE_SIZE } from '@/services/explorer'
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
 * Search and paging work exactly like Rapportages: the question lives in the
 * URL (`?q=…&page=…`), the server answers it, and a full page means there is
 * probably another one.
 */
const route = useRoute()
const router = useRouter()
const studio = useStudioStore()

const rows = ref<IReviewQueueItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const page = ref(1)

const hasMore = computed(() => rows.value.length === PAGE_SIZE)
const total = computed(() => studio.controle)

/** Read the URL into state. The address bar is the source of truth, not a mirror. */
function adoptRoute() {
  search.value = typeof route.query.q === 'string' ? route.query.q : ''
  const p = Number(route.query.page)
  page.value = Number.isInteger(p) && p > 0 ? p : 1
}

function push(next: { q?: string; page?: number }) {
  const q = next.q ?? search.value
  const p = next.page ?? page.value
  const query: Record<string, string> = {}
  if (q) query.q = q
  if (p > 1) query.page = String(p)
  router.push({ name: 'review-queue', query })
}

async function load() {
  try {
    loading.value = true
    error.value = null
    rows.value = await api.dataops.queue({
      q: search.value || undefined,
      limit: PAGE_SIZE,
      offset: (page.value - 1) * PAGE_SIZE,
    })
  } catch (e) {
    error.value = describeFailure(e, 'De controlelijst kon niet worden geladen.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

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
  const current = typeof route.query.q === 'string' ? route.query.q : ''
  if (q === current) return
  push({ q, page: 1 })
})

const COLUMNS: DataColumn[] = [
  { field: 'reference', title: 'Kenmerk', width: '150px' },
  { field: 'subject', title: 'Document', width: 'minmax(280px,1fr)' },
  { field: 'channel', title: 'Via', width: '110px' },
  { field: 'files', title: 'Bestanden', width: '90px', align: 'right' },
  { field: 'open', title: 'Voorstellen', width: '120px', align: 'right' },
  { field: 'receivedAt', title: 'Ontvangen', width: '190px' },
]

const WEEK = 7 * 24 * 3600 * 1000

const CHANNEL_LABEL: Record<string, string> = {
  upload: 'portaal',
  bulk_drop: 'bulk',
  email: 'e-mail',
}

const items = computed(() =>
  rows.value.map((r) => ({
    id: r.id,
    reference: r.reference ?? r.externalRef ?? '—',
    subject: r.subject ?? 'Zonder omschrijving',
    channel: CHANNEL_LABEL[r.channel] ?? r.channel,
    files: r.files,
    open: r.open,
    read: r.read,
    receivedAt: new Date(r.receivedAt).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    overdue: Date.now() - new Date(r.receivedAt).getTime() > WEEK,
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
      <span v-if="total != null" class="text-md font-mono tabular-nums text-faint">
        {{ total.toLocaleString('nl-NL') }} open
      </span>
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
      <span class="text-sm ml-auto font-mono text-faint">
        {{ items.length }}{{ hasMore ? '+' : '' }} rijen
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
        :columns="COLUMNS"
        :loading="loading"
        :selected-ids="selectedIds"
        selectable
        @toggle="toggleRow"
        @toggle-all="toggleAll"
        :empty-message="
          search
            ? `Niets gevonden voor “${search}”.`
            : 'Niets te controleren. Alles wat binnenkwam is beoordeeld.'
        "
        @select="open"
      >
        <template #reference="{ row }">
          <span class="text-sm font-mono text-faint">{{ row.reference }}</span>
        </template>
        <template #subject="{ row }">
          <span class="text-lg font-semibold text-body">{{ row.subject }}</span>
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
            <Button label="Vorige" :disabled="page <= 1" @click="push({ page: page - 1 })" />
            <Button label="Volgende" :disabled="!hasMore" @click="push({ page: page + 1 })" />
          </span>
        </template>
      </DataTable>
    </div>
  </AppShell>
</template>
