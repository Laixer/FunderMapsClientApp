<script setup lang="ts">
import { onBeforeMount, watch } from 'vue'
import { storeToRefs } from 'pinia'

import CommandPalette from '@/components/Layout/CommandPalette.vue'
import Sidebar from '@/components/Layout/Sidebar.vue'
import TopBar from '@/components/Layout/TopBar.vue'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'
import ShortcutsOverlay from '@/components/Common/ShortcutsOverlay.vue'
import ToastHost from '@/components/Common/ToastHost.vue'
import { useGlobalShortcuts } from '@/services/useGlobalShortcuts'
import { useSessionStore } from '@/stores/session'
import { useStudioStore } from '@/stores/studio'

/**
 * The frame every authenticated screen sits in: 248px rail, 54px bar, content.
 *
 * Desktop only, and explicit about it — `min-w-shell` (1528px) makes the shell
 * scroll horizontally on a narrow window rather than collapsing its columns.
 * This is a tool used at a desk on a wide monitor; a responsive version would
 * mean a three-pane editor that becomes a three-screen scroll, which is worse
 * than asking someone to widen their window.
 *
 * Two content modes. The default lets the page scroll under the bar, which is
 * right for the Werkbank and the dossier. `fill` pins the content to the
 * viewport instead and hands scrolling to the panes inside it — that is what
 * makes the explorer's table and the Invoer editor scroll independently while
 * their headers stay put.
 */
withDefaults(defineProps<{ crumb: string; fill?: boolean }>(), { fill: false })

// Mounted here rather than per view: the shell is the one component every
// authenticated page passes through, so the bindings live exactly as long as
// the app chrome does.
const { showShortcuts } = useGlobalShortcuts()

const studio = useStudioStore()
const { currentUser } = storeToRefs(useSessionStore())

// The session restores asynchronously on a cold load, so the user id can land
// after the shell has mounted — hence both the call and the watch.
onBeforeMount(() => studio.refreshCounts(currentUser.value?.id))
watch(currentUser, (user) => studio.refreshCounts(user?.id))
</script>

<template>
  <div class="grid min-h-screen min-w-shell grid-cols-[var(--spacing-sidebar)_minmax(var(--spacing-content),1fr)] bg-canvas">
    <Sidebar />

    <main class="flex min-w-0 flex-col">
      <TopBar :crumb="crumb" />

      <div
        :class="fill ? 'flex h-[calc(100vh-var(--spacing-topbar))] min-h-0 flex-col' : 'flex-1'"
      >
        <slot />
      </div>
    </main>

    <CommandPalette />
    <ShortcutsOverlay v-if="showShortcuts" @close="showShortcuts = false" />
    <ConfirmDialog />
    <ToastHost />
  </div>
</template>
