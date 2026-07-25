<script setup lang="ts">
import Sidebar from '@/components/Layout/Sidebar.vue'
import ShortcutsOverlay from '@/components/Common/ShortcutsOverlay.vue'
import { useGlobalShortcuts } from '@/services/useGlobalShortcuts'

// Mounted here rather than per view: the shell is the one component every
// authenticated page passes through, so the bindings live exactly as long as
// the app chrome does.
const { showShortcuts } = useGlobalShortcuts()
</script>

<template>
  <div class="bg-grey-100 min-h-screen">
    <Sidebar />
    <main class="ml-56 min-h-screen p-8">
      <slot />
    </main>

    <ShortcutsOverlay v-if="showShortcuts" @close="showShortcuts = false" />
  </div>
</template>
