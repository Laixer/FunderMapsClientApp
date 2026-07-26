<script setup lang="ts">
import ProgressBar from '@/components/Common/ProgressBar.vue'
import SampleReadonly from '@/components/Inquiry/SampleReadonly.vue'
import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import { countFilledSampleFields, sampleCompleteness } from '@/services/sampleFields'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'

/**
 * Every address in a dossier, collapsible.
 *
 * The completeness bar on each summary row is what makes this scannable: a
 * dossier of fourteen addresses of which three are empty shells answers "is
 * this finished?" before you open anything.
 */
defineProps<{
  samples: IInquirySample[]
  /** Initial state of the per-address panels (each can still be toggled). */
  expanded?: boolean
}>()

const addressStore = useAddressStore()

function filledLabel(sample: IInquirySample): string {
  const count = countFilledSampleFields(sample)
  return count === 1 ? '1 veld' : `${count} velden`
}
</script>

<template>
  <ul>
    <li v-for="sample in samples" :key="sample.id" class="border-b border-divider last:border-b-0">
      <details :open="expanded" class="group">
        <summary
          class="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 select-none hover:bg-raised"
        >
          <span aria-hidden="true" class="text-faint transition-transform group-open:rotate-90">
            ▸
          </span>
          <span class="text-lg min-w-0 flex-1 truncate font-semibold text-body">
            {{ formatAddress(addressStore.cache[sample.address]) }}
          </span>
          <span class="w-24 shrink-0">
            <ProgressBar
              :value="sampleCompleteness(sample)"
              :tone="countFilledSampleFields(sample) ? 'green' : 'red'"
            />
          </span>
          <span
            class="text-sm w-20 shrink-0 text-right font-mono"
            :class="countFilledSampleFields(sample) ? 'text-muted' : 'text-red'"
          >
            {{ filledLabel(sample) }}
          </span>
        </summary>
        <div class="border-t border-divider bg-raised px-4 py-3.5">
          <SampleReadonly :sample="sample" />
        </div>
      </details>
    </li>
  </ul>
</template>
