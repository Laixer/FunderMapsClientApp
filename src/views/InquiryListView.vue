<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { refDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import Table from '@/components/Common/Table.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import Input from '@/components/Common/Inputs/Input.vue'
import Select, { type SelectOption } from '@/components/Common/Inputs/Select.vue'
import CheckBox from '@/components/Common/Inputs/CheckBox.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import type { IInquiryListOpts } from '@/services/fundermaps/endpoints/inquiry'
import { inquiryTypeLabel, statusMeta, STATUS_META } from '@/services/inquiryEnums'
import { formatDate } from '@/utils/date'
import { getErrorMessage } from '@/services/fundermaps/errors'
import { useSessionStore } from '@/stores/session'
import { useRowKeyboard } from '@/services/useRowKeyboard'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { currentUser } = storeToRefs(useSessionStore())

const loading = ref(true)
const error: Ref<string | null> = ref(null)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const statusFilter: Ref<number | null> = ref(null)
/**
 * A status set handed over by an inbox lane (`?status=0,1`). The Select is
 * single-choice, so a two-status lane cannot be expressed in it — rather than
 * quietly dropping one, hold the set here and show it as a dismissible chip.
 * Cleared by the chip, or by choosing a status in the Select.
 */
const queryStatuses: Ref<number[]> = ref([])
const mineReviewer = ref(false)
const mineCreator = ref(false)
const sortField: Ref<string | null> = ref(null)
const sortOrder: Ref<'asc' | 'desc'> = ref('asc')
const rows: Ref<IInquiry[]> = ref([])

const columns = [
  { field: 'id', title: 'ID', width: '5rem', sortable: true },
  { field: 'documentName', title: t('inquiry.list.col.documentName'), sortable: true },
  { field: 'type', title: t('inquiry.list.col.type'), sortable: true },
  {
    field: 'documentDate',
    title: t('inquiry.list.col.documentDate'),
    width: '11rem',
    sortable: true,
  },
  { field: 'creator', title: t('inquiry.list.col.creator'), sortable: true },
  { field: 'reviewer', title: t('inquiry.list.col.reviewer'), sortable: true },
  { field: 'status', title: t('inquiry.list.col.status'), width: '11rem', sortable: true },
]

/** Table column field → API sort key. */
const SORT_KEYS: Record<string, NonNullable<IInquiryListOpts['sort']>> = {
  id: 'id',
  documentName: 'document_name',
  type: 'type',
  documentDate: 'document_date',
  creator: 'creator',
  reviewer: 'reviewer',
  status: 'status',
}

const statusOptions: SelectOption[] = Object.entries(STATUS_META).map(([value, meta]) => ({
  value: Number(value),
  label: meta.label,
}))

async function load() {
  try {
    loading.value = true
    error.value = null
    const opts: IInquiryListOpts = {}
    const q = search.value.trim()
    // Bare browse: most-recent slice. Search: server-side across the full
    // dataset (id / document_name / sample address / BAG identifiers).
    if (q) opts.q = q
    else opts.limit = 200
    if (queryStatuses.value.length) opts.status = [...queryStatuses.value]
    else if (statusFilter.value != null) opts.status = [statusFilter.value]
    const me = currentUser.value?.id
    if (mineCreator.value && me) opts.creator = me
    if (mineReviewer.value && me) opts.reviewer = me
    if (sortField.value) {
      opts.sort = SORT_KEYS[sortField.value]
      opts.order = sortOrder.value
    }
    rows.value = await api.inquiry.list(opts)
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    loading.value = false
  }
}

/**
 * Adopt the filters an inbox lane linked with, so "alles bekijken" lands on the
 * same set rather than on everything. A single status folds into the Select; a
 * set stays in `queryStatuses`. Runs during setup so it reads as initial state
 * rather than as a change.
 */
function applyQueryFilters() {
  const raw = route.query.status
  // Validated against the real status set, not just "is it a number": `Number('')`
  // is 0, which is a perfectly good `todo`, so `?status=,,` would otherwise
  // smuggle in a filter nobody asked for.
  const statuses = (typeof raw === 'string' ? raw.split(',') : [])
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && STATUS_META[v] !== undefined)
  if (statuses.length === 1) statusFilter.value = statuses[0]!
  else if (statuses.length > 1) queryStatuses.value = statuses

  const mine = route.query.mine
  if (mine === 'reviewer') mineReviewer.value = true
  else if (mine === 'creator') mineCreator.value = true
}

const queryStatusLabel = computed(() =>
  queryStatuses.value.map((v) => statusMeta(v).label).join(' + '),
)

function clearQueryStatuses() {
  queryStatuses.value = []
}

// Applied during setup, before the watchers exist: adopting the lane's filters
// is not a user action, and letting it flow through the watcher below would both
// fire a redundant request and — for a two-status lane, which also sets a
// "mine" checkbox — clear the very set it just adopted.
applyQueryFilters()

onBeforeMount(load)

watch([debouncedSearch, statusFilter, mineReviewer, mineCreator, sortField, sortOrder], load)
watch(queryStatuses, load)

// Picking a status in the Select conflicts with a lane's status set, so it wins.
// The "mine" checkboxes do not — they filter attribution, not status — so a lane
// filter survives them.
watch(statusFilter, (value) => {
  if (value != null) clearQueryStatuses()
})

// asc → desc → back to default recency ordering.
function handleSort(field: string) {
  if (sortField.value !== field) {
    sortField.value = field
    sortOrder.value = 'asc'
  } else if (sortOrder.value === 'asc') {
    sortOrder.value = 'desc'
  } else {
    sortField.value = null
    sortOrder.value = 'asc'
  }
}

function handleSelect(row: IInquiry) {
  router.push({ name: 'inquiry-view', params: { id: row.id } })
}

// j / k / Enter over the table — see services/useRowKeyboard.ts.
const { activeId } = useRowKeyboard({ rows, onOpen: handleSelect })

function newInquiry() {
  router.push({ name: 'inquiry-new' })
}
</script>

<template>
  <MainWrapper>
    <header class="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 class="text-grey-800 text-xl font-semibold">{{ t('inquiry.list.title') }}</h2>
        <p class="text-grey-700 mt-0.5 text-sm">{{ t('inquiry.list.subtitle') }}</p>
      </div>
      <Button lg :label="t('inquiry.list.newButton')" @click="newInquiry" />
    </header>

    <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div class="w-72">
        <Input
          id="inquiry-search"
          v-model="search"
          type="search"
          :placeholder="t('inquiry.list.searchPlaceholder')"
        />
      </div>
      <div class="w-48">
        <Select
          id="inquiry-status-filter"
          v-model="statusFilter"
          :options="statusOptions"
          :placeholder="t('inquiry.list.filter.allStatuses')"
          clearable
        />
      </div>
      <CheckBox
        id="inquiry-filter-reviewer"
        v-model="mineReviewer"
        :label="t('inquiry.list.filter.myReviews')"
      />
      <CheckBox
        id="inquiry-filter-creator"
        v-model="mineCreator"
        :label="t('inquiry.list.filter.myEntries')"
      />
      <button
        v-if="queryStatuses.length"
        type="button"
        class="inline-flex items-center gap-1.5 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900"
        :title="t('inquiry.list.filter.clearInbox')"
        @click="clearQueryStatuses"
      >
        {{ queryStatusLabel }}
        <span aria-hidden="true">✕</span>
      </button>
      <span class="text-grey-700 text-xs">{{ rows.length }}</span>
    </div>

    <Alert v-if="error" :closeable="true" class="mb-3" @close="error = null">
      {{ error }}
    </Alert>

    <Table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :emptyMessage="t('inquiry.list.empty')"
      :sortField="sortField"
      :sortOrder="sortOrder"
      :selectedId="activeId"
      @select="handleSelect"
      @sort="handleSort"
    >
      <template #id="{ row }">
        <span class="text-grey-700 font-mono text-xs">#{{ row.id }}</span>
      </template>
      <template #documentName="{ row }">
        <span class="text-grey-800 font-medium">{{ row.documentName }}</span>
      </template>
      <template #type="{ row }">{{ inquiryTypeLabel(row.type) }}</template>
      <template #documentDate="{ row }">{{ formatDate(row.documentDate) }}</template>
      <template #creator="{ row }">{{ row.attribution?.creatorName ?? '—' }}</template>
      <template #reviewer="{ row }">{{ row.attribution?.reviewerName ?? '—' }}</template>
      <template #status="{ row }">
        <StatusBadge :status="row.state?.auditStatus" />
      </template>
    </Table>
  </MainWrapper>
</template>
