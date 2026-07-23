<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import StatusBadge from '@/components/Common/StatusBadge.vue'
import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import { recoveryDocumentTypeLabel } from '@/services/recoveryEnums'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  building: string
  /** Inquiry to leave out of the overview (the one being edited). */
  excludeInquiry?: number
}>()

const loading = ref(false)
const failed = ref(false)
const inquiries = ref<IInquiry[]>([])
const recoveries = ref<IRecovery[]>([])

watch(
  () => props.building,
  async (building) => {
    inquiries.value = []
    recoveries.value = []
    failed.value = false
    if (!building) return
    loading.value = true
    try {
      const [i, r] = await Promise.all([
        api.inquiry.getByBuilding(building),
        api.recovery.getByBuilding(building),
      ])
      // A newer request may have started while this one was in flight;
      // only the response for the current building may land.
      if (building !== props.building) return
      inquiries.value = i.filter((x) => x.id !== props.excludeInquiry)
      recoveries.value = r
    } catch {
      // Context is best-effort decoration — never block the form on it.
      if (building === props.building) failed.value = true
    } finally {
      if (building === props.building) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="rounded-md border border-grey-200 bg-white px-4 py-3">
    <h4 class="text-xs font-semibold uppercase tracking-wide text-grey-700">
      Bekend op dit pand
    </h4>
    <p v-if="loading" class="mt-1 text-sm text-grey-700">Laden…</p>
    <p v-else-if="failed" class="mt-1 text-sm text-grey-700">
      Bestaande onderzoeken konden niet worden opgehaald.
    </p>
    <p v-else-if="!inquiries.length && !recoveries.length" class="mt-1 text-sm text-grey-700">
      Geen eerdere onderzoeken of herstel bekend.
    </p>
    <ul v-else class="mt-2 space-y-1.5">
      <li
        v-for="i in inquiries"
        :key="`inquiry-${i.id}`"
        class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      >
        <RouterLink
          :to="{ name: 'inquiry-view', params: { id: i.id } }"
          target="_blank"
          class="font-medium text-grey-800 hover:underline"
        >
          {{ inquiryTypeLabel(i.type) }}
        </RouterLink>
        <span class="text-xs text-grey-700">{{ formatDate(i.documentDate) }}</span>
        <StatusBadge :status="i.state?.auditStatus" />
      </li>
      <li
        v-for="r in recoveries"
        :key="`recovery-${r.id}`"
        class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      >
        <RouterLink
          :to="{ name: 'recovery-view', params: { id: r.id } }"
          target="_blank"
          class="font-medium text-grey-800 hover:underline"
        >
          Herstel: {{ recoveryDocumentTypeLabel(r.type) }}
        </RouterLink>
        <span class="text-xs text-grey-700">{{ formatDate(r.documentDate) }}</span>
        <StatusBadge :status="r.state?.auditStatus" />
      </li>
    </ul>
  </div>
</template>
