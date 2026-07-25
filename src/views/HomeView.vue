<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import WorklistLane from '@/components/Common/WorklistLane.vue'

import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import { LANES, laneQuery } from '@/services/worklist'
import { getErrorMessage } from '@/services/fundermaps/errors'
import { useSessionStore } from '@/stores/session'

/**
 * The landing page: your work, not the archive.
 *
 * `/` used to redirect to the inquiry list, which opens on the 200
 * most-recently-touched dossiers across the organisation — a filing cabinet
 * rather than a desk, at 26k dossiers. Each lane here is one question someone
 * arrives with, answered with filters the list endpoint already supported.
 *
 * This component owns fetching only; `WorklistLane` owns how a lane reads.
 */
const { t } = useI18n()
const router = useRouter()
const { currentUser } = storeToRefs(useSessionStore())

const loading = ref(true)
const error: Ref<string | null> = ref(null)
const rowsByLane = ref<Record<string, IInquiry[]>>({})

async function load() {
  const me = currentUser.value?.id
  if (!me) return
  try {
    loading.value = true
    error.value = null
    // One request per lane, in parallel: independent queries, and the page is
    // not useful until all of them have answered.
    const results = await Promise.all(LANES.map((lane) => api.inquiry.list(laneQuery(lane, me))))
    rowsByLane.value = Object.fromEntries(LANES.map((lane, i) => [lane.key, results[i]!]))
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)
// The session restores asynchronously on a cold load, so the user id can land
// after this view has mounted.
watch(currentUser, load)

const total = computed(() =>
  LANES.reduce((sum, lane) => sum + (rowsByLane.value[lane.key]?.length ?? 0), 0),
)

function open(row: IInquiry) {
  router.push({ name: 'inquiry-view', params: { id: row.id } })
}
</script>

<template>
  <MainWrapper>
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-grey-800 text-xl font-semibold">{{ t('home.title') }}</h2>
        <p class="text-grey-700 mt-0.5 text-sm">
          <template v-if="loading">{{ t('common.loading') }}</template>
          <template v-else-if="total === 0">{{ t('home.allClear') }}</template>
          <template v-else>{{ t('home.subtitle', { count: total }) }}</template>
        </p>
      </div>
      <Button
        lg
        :label="t('inquiry.list.newButton')"
        @click="router.push({ name: 'inquiry-new' })"
      />
    </header>

    <Alert v-if="error" :closeable="true" class="mb-3" @close="error = null">{{ error }}</Alert>

    <div class="space-y-6">
      <WorklistLane
        v-for="lane in LANES"
        :key="lane.key"
        :lane="lane"
        :rows="rowsByLane[lane.key] ?? []"
        :loading="loading"
        @select="open"
      />
    </div>
  </MainWrapper>
</template>
