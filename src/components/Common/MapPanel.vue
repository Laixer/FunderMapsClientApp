<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

import type { SamplePin } from '@/components/Mapbox/SampleMap.vue'

/**
 * A map at the top of a side pane.
 *
 * Fixed height, hairline rule underneath, and the pane's content below it —
 * the map is orientation, not the subject. Where a pane has no coordinates to
 * show it says so in a line instead of rendering an empty grey rectangle
 * somewhere in the North Sea.
 *
 * MapLibre is ~230 KB gzipped, so the map component is loaded on demand: the
 * explorer, the Werkbank and the dossier page all mount this shell, and most
 * visits never reach a pane that has pins.
 */
withDefaults(
  defineProps<{
    pins: SamplePin[]
    selectedId?: string | number | null
    height?: string
    /** Shown when there is nothing to plot. */
    emptyMessage?: string
  }>(),
  {
    selectedId: null,
    height: '230px',
    emptyMessage: 'Geen locatie bekend voor deze selectie.',
  },
)

defineEmits<{ select: [id: string | number] }>()

const SampleMap = defineAsyncComponent(() => import('@/components/Mapbox/SampleMap.vue'))
</script>

<template>
  <div class="shrink-0 border-b border-line bg-canvas" :style="{ height }">
    <SampleMap
      v-if="pins.length"
      :pins="pins"
      :selected-id="selectedId"
      @select="$emit('select', $event)"
    />
    <p v-else class="text-xs flex h-full items-center justify-center px-6 text-center text-subtle">
      {{ emptyMessage }}
    </p>
  </div>
</template>
