<script setup lang="ts">
import SampleReadonly from '@/components/Inquiry/SampleReadonly.vue'
import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import { countFilledSampleFields } from '@/services/sampleFields'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'

defineProps<{
  samples: IInquirySample[]
  /** Initial state of the per-address panels (user can still toggle each). */
  expanded?: boolean
}>()

const addressStore = useAddressStore()

function filledLabel(sample: IInquirySample): string {
  const count = countFilledSampleFields(sample)
  return count === 1 ? '1 veld ingevuld' : `${count} velden ingevuld`
}
</script>

<template>
  <ul class="overflow-hidden rounded-md border border-grey-200">
    <li v-for="s in samples" :key="s.id" class="border-b border-grey-200 last:border-b-0">
      <details :open="expanded" class="group">
        <summary
          class="flex cursor-pointer select-none flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-3 text-sm hover:bg-grey-100"
        >
          <span class="font-medium text-grey-800">
            {{ formatAddress(addressStore.cache[s.address]) }}
          </span>
          <span class="flex shrink-0 items-center gap-2 text-xs text-grey-700">
            {{ filledLabel(s) }}
            <span aria-hidden="true" class="transition-transform group-open:rotate-90">▸</span>
          </span>
        </summary>
        <div class="border-t border-grey-200 px-3 py-3">
          <SampleReadonly :sample="s" />
        </div>
      </details>
    </li>
  </ul>
</template>
