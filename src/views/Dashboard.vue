<script setup lang="ts">
import { onBeforeMount, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Card from '@/components/Common/Card.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'

import { useSessionStore } from '@/stores/session'
import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import { formatDate } from '@/utils/date'

const { t } = useI18n()
const router = useRouter()

const sessionStore = useSessionStore()
const { currentUser } = storeToRefs(sessionStore)

const loading = ref(true)
const recent: Ref<IInquiry[]> = ref([])

onBeforeMount(async () => {
  try {
    recent.value = await api.inquiry.list({ limit: 5 })
  } finally {
    loading.value = false
  }
})

function go(row: IInquiry) {
  router.push({ name: 'inquiry-view', params: { id: row.id } })
}
</script>

<template>
  <MainWrapper>
    <main class="col-span-3 mt-16 space-y-6 p-8">
      <header>
        <h1 class="text-2xl text-blue-900">{{ t('dashboard.title') }}</h1>
        <p class="text-sm text-grey-700">
          {{ t('dashboard.welcome', { name: currentUser?.given_name || currentUser?.email }) }}
        </p>
      </header>

      <Card>
        <header
          class="-mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
        >
          <div>
            <h2 class="heading-3">{{ t('dashboard.recent.title') }}</h2>
            <p class="mt-1 text-sm text-grey-700">{{ t('dashboard.recent.subtitle') }}</p>
          </div>
          <RouterLink :to="{ name: 'inquiry-list' }" class="text-sm text-green-700 underline">
            {{ t('dashboard.recent.viewAll') }}
          </RouterLink>
        </header>

        <p v-if="loading" class="text-sm text-grey-700">{{ t('common.loading') }}</p>
        <p v-else-if="recent.length === 0" class="text-sm text-grey-700">
          {{ t('dashboard.recent.empty') }}
        </p>
        <ul v-else class="divide-y divide-grey-200">
          <li
            v-for="row in recent"
            :key="row.id"
            class="flex cursor-pointer items-center justify-between gap-4 py-3 hover:bg-grey-100"
            @click="go(row)"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-grey-800">{{ row.documentName }}</p>
              <p class="text-xs text-grey-700">
                {{ inquiryTypeLabel(row.type) }} · {{ formatDate(row.documentDate) }}
              </p>
            </div>
            <StatusBadge :status="row.state?.auditStatus" />
          </li>
        </ul>
      </Card>
    </main>
  </MainWrapper>
</template>
