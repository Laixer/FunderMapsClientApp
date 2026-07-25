<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import Icon from '@/components/Common/Icon.vue'
import Table from '@/components/Common/Table.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'

import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import {
  laneCountLabel,
  laneHiddenCount,
  lanePreview,
  laneRouteQuery,
  type Lane,
} from '@/services/worklist'
import { formatDate } from '@/utils/date'

/**
 * One lane of the worklist: a heading that counts, and a short table.
 *
 * Presentational on purpose — the page owns fetching, this owns how a lane
 * reads. That split is also what makes the lane renderable in isolation, which
 * matters in a repo with no test runner.
 */
const props = defineProps<{
  lane: Lane
  rows: IInquiry[]
  loading?: boolean
}>()

const emit = defineEmits<{ select: [row: IInquiry] }>()

const { t } = useI18n()

const columns = computed(() => [
  { field: 'id', title: 'ID', width: '5rem' },
  { field: 'documentName', title: t('inquiry.list.col.documentName') },
  { field: 'type', title: t('inquiry.list.col.type'), width: '12rem' },
  { field: 'documentDate', title: t('inquiry.list.col.documentDate'), width: '9rem' },
  { field: 'status', title: t('inquiry.list.col.status'), width: '10rem' },
])

const isEmpty = computed(() => !props.loading && props.rows.length === 0)
const hidden = computed(() => laneHiddenCount(props.rows))

/** Red only for a lane that is both urgent and non-empty. */
const badgeClass = computed(() => {
  if (props.rows.length === 0) return 'bg-grey-100 text-grey-700'
  return props.lane.urgent ? 'bg-red-50 text-red-800' : 'bg-blue-100 text-blue-900'
})
</script>

<template>
  <section>
    <h3 class="mb-2 flex flex-wrap items-center gap-2">
      <Icon
        :name="lane.icon"
        size="sm"
        :class="lane.urgent && rows.length ? 'text-red-800' : 'text-grey-700'"
      />
      <span class="text-grey-800 text-sm font-semibold">{{ lane.title }}</span>
      <span v-if="!loading" class="rounded px-1.5 py-0.5 text-xs font-medium" :class="badgeClass">
        {{ laneCountLabel(rows) }}
      </span>
      <RouterLink
        v-if="hidden"
        :to="{ name: 'inquiry-list', query: laneRouteQuery(lane) }"
        class="text-grey-700 hover:text-grey-800 ml-auto text-xs font-medium underline underline-offset-2"
      >
        {{ t('home.showAll', { count: hidden }) }}
      </RouterLink>
    </h3>

    <!-- A clear lane is good news; say it in a line rather than an empty table
         with five column headers. -->
    <p
      v-if="isEmpty"
      class="border-grey-200 text-grey-700 rounded-md border border-dashed px-3 py-3 text-sm"
    >
      {{ lane.empty }}
    </p>
    <Table
      v-else
      :rows="lanePreview(rows)"
      :columns="columns"
      :loading="loading"
      @select="emit('select', $event)"
    >
      <template #id="{ row }">
        <span class="text-grey-700 font-mono text-xs">#{{ row.id }}</span>
      </template>
      <template #documentName="{ row }">
        <span class="text-grey-800 font-medium">{{ row.documentName }}</span>
      </template>
      <template #type="{ row }">{{ inquiryTypeLabel(row.type) }}</template>
      <template #documentDate="{ row }">{{ formatDate(row.documentDate) }}</template>
      <template #status="{ row }">
        <StatusBadge :status="row.state?.auditStatus" />
      </template>
    </Table>
  </section>
</template>
