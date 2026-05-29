<script setup lang="ts">
import { onBeforeMount, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { refDebounced } from '@vueuse/core'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import Table from '@/components/Common/Table.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import Input from '@/components/Common/Inputs/Input.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import { formatDate } from '@/utils/date'
import { getErrorMessage } from '@/services/fundermaps/errors'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const error: Ref<string | null> = ref(null)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const rows: Ref<IInquiry[]> = ref([])

const columns = [
  { field: 'id', title: 'ID', width: '5rem' },
  { field: 'documentName', title: t('inquiry.list.col.documentName') },
  { field: 'type', title: t('inquiry.list.col.type') },
  { field: 'documentDate', title: t('inquiry.list.col.documentDate'), width: '11rem' },
  { field: 'creator', title: t('inquiry.list.col.creator') },
  { field: 'reviewer', title: t('inquiry.list.col.reviewer') },
  { field: 'status', title: t('inquiry.list.col.status'), width: '11rem' },
]

async function load(query: string) {
  try {
    loading.value = true
    error.value = null
    const q = query.trim()
    // Bare browse: most-recent slice. Search: server-side across the full
    // dataset (id / document_name / sample address / BAG identifiers).
    rows.value = q ? await api.inquiry.list({ q }) : await api.inquiry.list({ limit: 200 })
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    loading.value = false
  }
}

onBeforeMount(() => load(''))
watch(debouncedSearch, (q) => load(q))

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

    <div class="mb-3 flex items-center gap-3">
      <div class="w-72">
        <Input
          id="inquiry-search"
          v-model="search"
          type="search"
          :placeholder="t('inquiry.list.searchPlaceholder')"
        />
      </div>
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
      @select="handleSelect"
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
