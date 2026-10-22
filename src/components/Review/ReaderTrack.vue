<script setup lang="ts">
import type { Track } from '@/services/readerTrack'

/**
 * Beside a proposed value: how often a reviewer took over what the reader
 * proposed for this field (services/readerTrack.ts). A small bar (green taken
 * over, light red corrected, red rejected) and one line; amber words when the
 * reader often gets this field wrong. The tooltip has the counts.
 */
defineProps<{ track: Track }>()
</script>

<template>
  <span class="flex min-w-0 items-center gap-1.5" :title="track.title">
    <span class="sr-only">{{ track.title }}</span>
    <span aria-hidden="true" class="flex h-1.5 w-9 shrink-0 gap-px overflow-hidden rounded-full">
      <span class="bg-green-ink" :style="{ flexGrow: track.taken, flexBasis: 0 }" />
      <span v-if="track.corrected > 0" class="bg-[#e8857c]" :style="{ flexGrow: track.corrected, flexBasis: 0, minWidth: '2px' }" />
      <span v-if="track.rejected > 0" class="bg-red-ink" :style="{ flexGrow: track.rejected, flexBasis: 0, minWidth: '2px' }" />
    </span>
    <span aria-hidden="true" class="text-sm truncate" :class="track.watch ? 'font-semibold text-amber-ink' : 'text-faint'">
      {{ track.text }}
    </span>
  </span>
</template>
