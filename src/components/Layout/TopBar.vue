<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { crumbTrail } from '@/services/navigation'

/**
 * A 54px translucent strip that says where you are: the part of the studio
 * (Inzicht, Gegevens, Werk), the place that owns the page as a link back, and
 * the page itself — "Gegevens / Rapportages / Archiefonderzoek …".
 *
 * No global button any more (2026-10-22): "Nieuwe rapportage" was the loudest
 * thing on every screen of a studio where agents do the entry. Making a record
 * by hand lives in the Rapportages and Herstel headers, Ctrl+K and `g n`.
 * Everything a page can do lives in that page's own header, next to the thing
 * it acts on.
 *
 * Translucent with a blur because the content scrolls under it, and a solid bar
 * over a scrolling table reads as a seam.
 */
defineProps<{ crumb: string }>()

const route = useRoute()
const trail = computed(() => crumbTrail(String(route.name ?? '')))
</script>

<template>
  <header
    class="sticky top-0 z-5 flex h-topbar shrink-0 items-center gap-3.5 border-b border-line bg-white/85 px-6 backdrop-blur-md"
  >
    <nav class="text-md flex min-w-0 items-center gap-2 text-faint" aria-label="Kruimelpad">
      <template v-for="step in trail" :key="step.label">
        <RouterLink v-if="step.route" :to="{ name: step.route }" class="shrink-0 hover:text-strong hover:underline">{{ step.label }}</RouterLink>
        <span v-else class="shrink-0">{{ step.label }}</span>
        <span aria-hidden="true">/</span>
      </template>
      <span class="truncate font-semibold text-strong" aria-current="page">{{ crumb }}</span>
    </nav>

    <div class="ml-auto flex items-center gap-2">
      <slot name="end" />
    </div>
  </header>
</template>
