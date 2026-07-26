<script setup lang="ts">
import { useRouter } from 'vue-router'

import Button from '@/components/Common/Buttons/Button.vue'

/**
 * A 54px translucent strip: where you are on the left, the one global action on
 * the right.
 *
 * The right-hand side holds only "Nieuwe rapportage" — the single thing you
 * might want from any screen. Everything a *page* can do lives in that page's
 * own header, next to the thing it acts on. A top bar that accumulates
 * per-screen buttons becomes a place people stop looking.
 *
 * Translucent with a blur because the content scrolls under it, and a solid bar
 * over a scrolling table reads as a seam.
 */
defineProps<{ crumb: string }>()

const router = useRouter()
</script>

<template>
  <header
    class="sticky top-0 z-5 flex h-topbar shrink-0 items-center gap-3.5 border-b border-line bg-white/85 px-6 backdrop-blur-md"
  >
    <nav class="text-md flex items-center gap-2 text-faint" aria-label="Kruimelpad">
      <span>FunderMaps</span>
      <span aria-hidden="true">/</span>
      <span class="truncate font-semibold text-strong" aria-current="page">{{ crumb }}</span>
    </nav>

    <div class="ml-auto flex items-center gap-2">
      <Button
        variant="primary"
        label="Nieuwe rapportage"
        @click="router.push({ name: 'inquiry-new' })"
      />
    </div>
  </header>
</template>
