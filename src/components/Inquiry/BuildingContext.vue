<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import EmptyState from '@/components/Common/EmptyState.vue'
import { TONE_DOT } from '@/services/tone'
import api from '@/services/fundermaps'
import type { IInquiry } from '@/services/fundermaps/interfaces/IInquiry'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import { inquiryTypeLabel, statusMeta } from '@/services/inquiryEnums'
import { recoveryDocumentTypeLabel } from '@/services/recoveryEnums'
import { formatDateShort } from '@/utils/date'

/**
 * What is already known about this pand.
 *
 * The single most valuable thing to show while someone is typing a QuickScan:
 * whether this building already has one, whether it has been repaired, whether
 * a resident reported something last month. Catching a duplicate or a
 * contradiction here costs a glance; catching it after approval costs a
 * correction that has already reached the map.
 *
 * Best-effort throughout — this is context, and the form must never wait on it
 * or fail with it.
 */
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
      // A newer request may have started while this one was in flight; only the
      // response for the current building may land.
      if (building !== props.building) return
      inquiries.value = i.filter((x) => x.id !== props.excludeInquiry)
      recoveries.value = r
    } catch {
      if (building === props.building) failed.value = true
    } finally {
      if (building === props.building) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-2">
    <p v-if="loading" class="text-sm text-muted">Laden…</p>
    <p v-else-if="failed" class="text-sm text-muted">
      Bestaande onderzoeken konden niet worden opgehaald.
    </p>
    <EmptyState v-else-if="!inquiries.length && !recoveries.length">
      Geen eerder onderzoek of herstel op dit pand.
    </EmptyState>

    <template v-else>
      <RouterLink
        v-for="row in inquiries"
        :key="`inquiry-${row.id}`"
        :to="{ name: 'inquiry-view', params: { id: row.id } }"
        target="_blank"
        class="group flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2 hover:border-line-hover hover:bg-raised"
      >
        <span
          aria-hidden="true"
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="TONE_DOT[statusMeta(row.state?.auditStatus).tone]"
        />
        <span class="min-w-0 flex-1">
          <span class="text-md block truncate font-semibold text-body">
            {{ inquiryTypeLabel(row.type) }}
          </span>
          <span class="text-xs block font-mono text-faint">
            #{{ row.id }} · {{ formatDateShort(row.documentDate) }} ·
            {{ statusMeta(row.state?.auditStatus).label.toLowerCase() }}
          </span>
        </span>
        <span aria-hidden="true" class="shrink-0 text-ghost group-hover:text-strong">→</span>
      </RouterLink>

      <RouterLink
        v-for="row in recoveries"
        :key="`recovery-${row.id}`"
        :to="{ name: 'recovery-view', params: { id: row.id } }"
        target="_blank"
        class="group flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2 hover:border-line-hover hover:bg-raised"
      >
        <span
          aria-hidden="true"
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="TONE_DOT[statusMeta(row.state?.auditStatus).tone]"
        />
        <span class="min-w-0 flex-1">
          <span class="text-md block truncate font-semibold text-body">
            Herstel: {{ recoveryDocumentTypeLabel(row.type) }}
          </span>
          <span class="text-xs block font-mono text-faint">
            #{{ row.id }} · {{ formatDateShort(row.documentDate) }} ·
            {{ statusMeta(row.state?.auditStatus).label.toLowerCase() }}
          </span>
        </span>
        <span aria-hidden="true" class="shrink-0 text-ghost group-hover:text-strong">→</span>
      </RouterLink>
    </template>
  </div>
</template>
