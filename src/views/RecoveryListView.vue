<script setup lang="ts">
import { onBeforeMount, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import Vue3Datatable from '@bhplugin/vue3-datatable'
import '@bhplugin/vue3-datatable/dist/style.css'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Card from '@/components/Common/Card.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'

import api from '@/services/fundermaps'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import { recoveryDocumentTypeLabel } from '@/services/recoveryEnums'
import { formatDate } from '@/utils/date'
import { getErrorMessage } from '@/services/fundermaps/errors'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const error: Ref<string | null> = ref(null)
const rows: Ref<IRecovery[]> = ref([])

const cols = [
  { field: 'id', title: 'ID', width: '5rem' },
  { field: 'documentName', title: t('recovery.list.col.documentName') },
  { field: 'type', title: t('recovery.list.col.type') },
  { field: 'documentDate', title: t('recovery.list.col.documentDate') },
  { field: 'creator', title: t('recovery.list.col.creator') },
  { field: 'reviewer', title: t('recovery.list.col.reviewer') },
  { field: 'status', title: t('recovery.list.col.status') },
]

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

function handleRowClick(row: IRecovery) {
  router.push({ name: 'recovery-view', params: { id: row.id } })
}

function newRecovery() {
  router.push({ name: 'recovery-new' })
}
</script>

<template>
  <MainWrapper>
    <Card class="List col-span-3 mt-16">
      <header
        class="-mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
      >
        <div>
          <h2 class="heading-3">{{ t('recovery.list.title') }}</h2>
          <p class="mt-1 text-sm text-grey-700">{{ t('recovery.list.subtitle') }}</p>
        </div>
        <button
          type="button"
          class="button rounded bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          @click="newRecovery"
        >
          {{ t('recovery.list.newButton') }}
        </button>
      </header>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <Vue3Datatable
        :rows="rows"
        :columns="cols"
        :loading="loading"
        :sortable="true"
        :columnFilter="true"
        sortColumn="id"
        sortDirection="desc"
        @rowClick="handleRowClick"
      >
        <template #type="data">{{ recoveryDocumentTypeLabel(data.value.type) }}</template>
        <template #documentDate="data">{{ formatDate(data.value.documentDate) }}</template>
        <template #creator="data">{{ data.value.attribution?.creatorName ?? '-' }}</template>
        <template #reviewer="data">{{ data.value.attribution?.reviewerName ?? '-' }}</template>
        <template #status="data">
          <StatusBadge :status="data.value.state?.auditStatus" />
        </template>
      </Vue3Datatable>
    </Card>
  </MainWrapper>
</template>
