<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

import UserMenu from '@/components/UserMenu.vue'
import { NAV_GROUPS } from '@/services/navigation'
import { SIDEBAR_HINTS } from '@/services/shortcuts'
import { useStudioStore } from '@/stores/studio'

/**
 * The studio's left rail: where you are, where else you can be, and how many
 * things are waiting in each place.
 *
 * Every row carries a status dot and a right-aligned mono count. The dots line
 * up into a column you can read without reading — green means you are here,
 * grey means you are not. The counts are what turn the sidebar from navigation
 * into a dashboard: "Rapportages 26.641" is the size of the archive, "Werkbank
 * 38" is the size of your afternoon.
 *
 * The search button looks like an input but opens the command palette, because
 * a second search field in the chrome would compete with the one the explorer
 * already has.
 */
const route = useRoute()
const studio = useStudioStore()
const { counts } = storeToRefs(studio)

const activeRoute = computed(() => String(route.name ?? ''))

/**
 * Which nav row owns the current route. The wizard steps and the detail views
 * are not destinations of their own — while you are inside a dossier the rail
 * should still say *Rapportages* rather than go blank.
 */
const OWNED_BY: Record<string, string> = {
  home: 'home',
  'inquiry-list': 'inquiry-list',
  'inquiry-view': 'inquiry-list',
  'inquiry-edit-1': 'inquiry-list',
  'inquiry-edit-2': 'inquiry-list',
  'inquiry-edit-3': 'inquiry-list',
  'inquiry-new': 'inquiry-new',
  'recovery-list': 'recovery-list',
  'recovery-view': 'recovery-list',
  'recovery-edit-1': 'recovery-list',
  'recovery-edit-2': 'recovery-list',
  'recovery-edit-3': 'recovery-list',
  'recovery-new': 'recovery-new',
}

function isActive(routeName: string): boolean {
  return OWNED_BY[activeRoute.value] === routeName
}

/** Thousands separated the Dutch way, so 26641 reads as a size and not an id. */
const formatCount = (value: number | null | undefined): string =>
  value == null ? '' : value.toLocaleString('nl-NL')
</script>

<template>
  <aside
    class="sticky top-0 flex h-screen w-sidebar flex-col gap-5 border-r border-line bg-surface px-3.5 py-4"
  >
    <div class="flex items-center gap-2.5 px-2">
      <span
        aria-hidden="true"
        class="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-green"
      >
        <span class="h-2 w-2 rounded-full bg-white" />
      </span>
      <span class="font-display text-[16px] font-bold tracking-[-0.2px] text-ink">FunderMaps</span>
      <span
        class="ml-auto rounded-xs border border-line px-1 py-0.5 font-mono text-[9px] tracking-[0.06em] text-faint"
      >
        STUDIO
      </span>
    </div>

    <button
      type="button"
      class="flex w-full items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-2 text-left hover:border-line-hover hover:bg-surface"
      @click="studio.openPalette()"
    >
      <span aria-hidden="true" class="text-lg text-faint">⌕</span>
      <span class="text-lg text-subtle">Zoek of spring naar…</span>
      <kbd
        class="text-2xs ml-auto rounded-xs border border-line bg-surface px-1 py-px font-mono text-faint"
      >
        ⌘K
      </kbd>
    </button>

    <nav v-for="group in NAV_GROUPS" :key="group.title" class="flex flex-col gap-0.5">
      <p class="text-2xs px-2.5 pb-1.5 font-bold tracking-[0.1em] text-label">{{ group.title }}</p>
      <RouterLink
        v-for="item in group.items"
        :key="item.route"
        :to="{ name: item.route }"
        class="text-xl flex items-center gap-2.5 rounded-lg px-2.5 py-2"
        :class="
          isActive(item.route)
            ? 'bg-green-wash font-bold text-green-deep'
            : 'font-medium text-muted hover:bg-sunken'
        "
      >
        <span
          aria-hidden="true"
          class="h-[5px] w-[5px] shrink-0 rounded-full"
          :class="isActive(item.route) ? 'bg-green' : 'bg-line-hover'"
        />
        <span class="truncate">{{ item.label }}</span>
        <span
          v-if="item.counter && counts[item.counter] != null"
          class="text-xs ml-auto shrink-0 font-mono"
          :class="isActive(item.route) ? 'text-green-ink/70' : 'text-label'"
        >
          {{ formatCount(counts[item.counter]) }}
        </span>
      </RouterLink>
    </nav>

    <!-- Shortcuts nobody can discover are shortcuts nobody uses. Pinned to the
         bottom of the rail, above the user row. -->
    <div
      class="mt-auto flex flex-col gap-1.5 rounded-xl border border-dashed border-line-strong bg-raised px-2.5 py-2.5"
    >
      <p class="text-2xs font-bold tracking-[0.09em] text-label">SNELTOETSEN</p>
      <p
        v-for="hint in SIDEBAR_HINTS"
        :key="hint.keys"
        class="text-sm flex justify-between gap-2 text-muted"
      >
        <span>{{ hint.label }}</span>
        <kbd class="font-mono">{{ hint.keys }}</kbd>
      </p>
    </div>

    <UserMenu />
  </aside>
</template>
