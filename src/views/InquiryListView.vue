<script setup lang="ts">
import { onBeforeMount, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
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
import { inquiryTypeLabel, STATUS_META } from '@/services/inquiryEnums'
import { formatDate } from '@/utils/date'
import { getErrorMessage } from '@/services/fundermaps/errors'
import { useSessionStore } from '@/stores/session'

const { t } = useI18n()
const router = useRouter()
const { currentUser } = storeToRefs(useSessionStore())

const loading = ref(true)
const error: Ref<string | null> = ref(null)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const statusFilter: Ref<number | null> = ref(null)
const mineReviewer = ref(false)
const mineCreator = ref(false)
const sortField: Ref<string | null> = ref(null)
const sortOrder: Ref<'asc' | 'desc'> = ref('asc')
const rows: Ref<IInquiry[]> = ref([])

const columns = [
  { field: 'id', title: 'ID', width: '5rem', sortable: true },
  { field: 'documentName', title: t('inquiry.list.col.documentName'), sortable: true },
  { field: 'type', title: t('inquiry.list.col.type'), sortable: true },
  { field: 'documentDate', title: t('inquiry.list.col.documentDate'), width: '11rem', sortable: true },
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
    if (statusFilter.value != null) opts.status = [statusFilter.value]
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

onBeforeMount(load)
watch([debouncedSearch, statusFilter, mineReviewer, mineCreator, sortField, sortOrder], load)

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

function newInquiry() {
  router.push({ name: 'inquiry-new' })
}
</script>

<template>
  <MainWrapper>
    <header class="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-grey-800">{{ t('inquiry.list.title') }}</h2>
        <p class="mt-0.5 text-sm text-grey-700">{{ t('inquiry.list.subtitle') }}</p>
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
      <span class="text-xs text-grey-700">{{ rows.length }}</span>
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
      @select="handleSelect"
      @sort="handleSort"
    >
      <template #id="{ row }">
        <span class="font-mono text-xs text-grey-700">#{{ row.id }}</span>
      </template>
      <template #documentName="{ row }">
        <span class="font-medium text-grey-800">{{ row.documentName }}</span>
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
