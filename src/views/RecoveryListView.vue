<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import Table from '@/components/Common/Table.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import Input from '@/components/Common/Inputs/Input.vue'

import api from '@/services/fundermaps'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import { recoveryDocumentTypeLabel } from '@/services/recoveryEnums'
import { formatDate } from '@/utils/date'
import { getErrorMessage } from '@/services/fundermaps/errors'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const error: Ref<string | null> = ref(null)
const search = ref('')
const rows: Ref<IRecovery[]> = ref([])

const columns = [
  { field: 'id', title: 'ID', width: '5rem' },
  { field: 'documentName', title: t('recovery.list.col.documentName') },
  { field: 'type', title: t('recovery.list.col.type') },
  { field: 'documentDate', title: t('recovery.list.col.documentDate'), width: '11rem' },
  { field: 'creator', title: t('recovery.list.col.creator') },
  { field: 'reviewer', title: t('recovery.list.col.reviewer') },
  { field: 'status', title: t('recovery.list.col.status'), width: '11rem' },
]

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) => {
    const docName = (r.documentName ?? '').toLowerCase()
    const creator = (r.attribution?.creatorName ?? '').toLowerCase()
    const reviewer = (r.attribution?.reviewerName ?? '').toLowerCase()
    const typeLabel = recoveryDocumentTypeLabel(r.type).toLowerCase()
    return (
      String(r.id).includes(q) ||
      docName.includes(q) ||
      typeLabel.includes(q) ||
      creator.includes(q) ||
      reviewer.includes(q)
    )
  })
})

async function load() {
  try {
    loading.value = true
    error.value = null
    rows.value = await api.recovery.list({ limit: 200 })
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

function handleSelect(row: IRecovery) {
  router.push({ name: 'recovery-view', params: { id: row.id } })
}

function newRecovery() {
  router.push({ name: 'recovery-new' })
}
</script>

<template>
  <MainWrapper>
    <header class="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-grey-800">{{ t('recovery.list.title') }}</h2>
        <p class="mt-0.5 text-sm text-grey-700">{{ t('recovery.list.subtitle') }}</p>
      </div>
      <Button lg :label="t('recovery.list.newButton')" @click="newRecovery" />
    </header>

    <div class="mb-3 flex items-center gap-3">
      <div class="w-72">
        <Input
          id="recovery-search"
          v-model="search"
          type="search"
          :placeholder="t('recovery.list.searchPlaceholder')"
        />
      </div>
      <span class="text-xs text-grey-700">{{ filteredRows.length }} / {{ rows.length }}</span>
    </div>

    <Alert v-if="error" :closeable="true" class="mb-3" @close="error = null">
      {{ error }}
    </Alert>

    <Table
      :rows="filteredRows"
      :columns="columns"
      :loading="loading"
      :emptyMessage="t('recovery.list.empty')"
      @select="handleSelect"
    >
      <template #id="{ row }">
        <span class="font-mono text-xs text-grey-700">#{{ row.id }}</span>
      </template>
      <template #documentName="{ row }">
        <span class="font-medium text-grey-800">{{ row.documentName }}</span>
      </template>
      <template #type="{ row }">{{ recoveryDocumentTypeLabel(row.type) }}</template>
      <template #documentDate="{ row }">{{ formatDate(row.documentDate) }}</template>
      <template #creator="{ row }">{{ row.attribution?.creatorName ?? '—' }}</template>
      <template #reviewer="{ row }">{{ row.attribution?.reviewerName ?? '—' }}</template>
      <template #status="{ row }">
        <StatusBadge :status="row.state?.auditStatus" />
      </template>
    </Table>
  </MainWrapper>
</template>
