<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import UserMenu from '@/components/UserMenu.vue'
import { NAV_GROUPS, OWNED_BY } from '@/services/navigation'
import {
  DEFAULT_VIEW,
  defaultView,
  deleteView,
  routeViewKey,
  viewRoute,
  type SavedView,
  type ViewGroup,
} from '@/services/reviewExplorer'
import { keyLabel, SIDEBAR_HINTS } from '@/services/shortcuts'
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
const router = useRouter()
const studio = useStudioStore()
const { counts, reviewGroups, reviewViews, viewCounts } = storeToRefs(studio)

const activeRoute = computed(() => String(route.name ?? ''))

function isActive(routeName: string): boolean {
  return OWNED_BY[activeRoute.value] === routeName
}

/** Thousands separated the Dutch way, so 26641 reads as a size and not an id. */
const formatCount = (value: number | null | undefined): string =>
  value == null ? '' : value.toLocaleString('nl-NL')

/* ---------------------------------------------------- Controle's views */

/**
 * Controle's views stand under it on every page, grouped and counted, like
 * the folders of a mailbox (2026-10-22: at first only while in Controle; the
 * answer was "always show"). Their counts come with the shell's refresh.
 */
const inControle = computed(() => isActive('review-queue'))

const known = (key: string) => reviewViews.value.some((v) => v.key === key)

/**
 * The view on screen. In a dossier: the list it was opened from, which rides
 * along in its URL, and none when it was opened from elsewhere. The bare
 * Controle link is the Wachtrij (the page writes that out at once).
 */
const activeView = computed(() => {
  if (!inControle.value) return null
  const raw = route.query as Record<string, unknown>
  if (activeRoute.value === 'review-dossier') {
    return typeof raw.view === 'string' && known(raw.view) ? raw.view : null
  }
  return Object.keys(raw).length ? routeViewKey(raw, known) : DEFAULT_VIEW
})

const viewsOf = (group: ViewGroup) =>
  group.views.map((key) => reviewViews.value.find((v) => v.key === key)).filter((v): v is SavedView => !!v)

function removeView(view: SavedView) {
  // Asked first: once the view is gone, its link reads as Alles.
  const onScreen = activeView.value === view.key
  deleteView(view.key)
  studio.reloadReviewViews()
  if (onScreen) router.push(viewRoute(defaultView()))
}
</script>

<template>
  <aside
    class="sticky top-0 flex h-screen w-sidebar flex-col gap-3 border-r border-line bg-surface px-3.5 py-3.5"
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
        {{ keyLabel('⌘K') }}
      </kbd>
    </button>

    <!-- Scrolls only when a window is too short for WERK's views. -mx-1 px-1:
         room for the focus ring. -->
    <div class="-mx-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1 [scrollbar-width:thin]">
      <nav
        v-for="group in NAV_GROUPS.filter((g) => !g.hidden)"
        :key="group.title"
        class="flex flex-col gap-0.5"
        :aria-label="group.title ? group.title.toLowerCase() : 'vandaag'"
      >
        <p v-if="group.title" class="text-2xs px-2.5 pb-1 font-bold tracking-[0.1em] text-label">{{ group.title }}</p>
        <template v-for="item in group.items" :key="item.route">
          <!-- Controle has no row of its own (2026-10-22: "remove the controle and have all those items
               listed on the same level under WERK"): its views are the rows of WERK, in the rail's own
               shape and size — the dot, the green for where you are, the count on the right — spaced as
               the rows of GEGEVENS ("use the proper spacing … like in gegevens"). The groups are a gap; a
               screen reader still hears their names, and the page says "Te verwerken › Archiefverwerking". -->
          <div v-if="item.route === 'review-queue'" class="flex flex-col gap-0.5" aria-label="Weergaven van Controle" role="group">
            <template v-for="(viewGroup, g) in reviewGroups" :key="viewGroup.key">
              <p v-if="!viewGroup.single" class="sr-only">{{ viewGroup.label }}</p>
              <!-- The view and its delete cross are two buttons side by side: a
                   cross inside the link could not be reached with the keyboard. -->
              <div
                v-for="(view, i) in viewsOf(viewGroup)"
                :key="view.key"
                class="group flex items-center"
                :class="{ 'mt-1.5': g > 0 && i === 0 }"
              >
                <RouterLink
                  :to="viewRoute(view)"
                  class="text-xl flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-[3px]"
                  :class="
                    activeView === view.key
                      ? 'bg-green-wash font-bold text-green-deep'
                      : 'font-medium text-muted hover:bg-sunken hover:text-strong'
                  "
                  :aria-current="activeView === view.key ? 'page' : undefined"
                >
                  <span
                    aria-hidden="true"
                    class="h-[5px] w-[5px] shrink-0 rounded-full"
                    :class="activeView === view.key ? 'bg-green' : 'bg-line-hover'"
                  />
                  <span class="truncate">{{ view.label }}</span>
                  <span
                    v-if="viewCounts[view.key] != null"
                    class="text-xs ml-auto shrink-0 font-mono"
                    :class="activeView === view.key ? 'text-green-ink/70' : 'text-label'"
                  >
                    {{ formatCount(viewCounts[view.key]) }}
                  </span>
                </RouterLink>
                <button
                  v-if="!view.builtin"
                  type="button"
                  class="text-xs shrink-0 px-1 text-label opacity-0 group-hover:opacity-100 hover:text-red focus-visible:opacity-100"
                  :aria-label="`Weergave ${view.label} verwijderen`"
                  @click="removeView(view)"
                >
                  ×
                </button>
              </div>
            </template>
          </div>
          <RouterLink
            v-else
            :to="{ name: item.route }"
            class="text-xl flex items-center gap-2.5 rounded-lg px-2.5 py-[3px]"
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
        </template>
      </nav>
    </div>

    <!-- Shortcuts nobody can discover are shortcuts nobody uses. Pinned to the
         bottom of the rail, above the user row, on every page; on a short
         window the nav above it scrolls instead. No caption since the rail grew
         (2026-10-22): the dashed card and its keys say what it is; a screen reader
         hears its name. One line since Datakwaliteit (2026-10-23): ⌘K is in the
         search field at the top, and the rest reads fine side by side. -->
    <div
      class="mt-auto flex items-center justify-between gap-2 rounded-xl border border-dashed border-line-strong bg-raised px-2.5 py-1.5"
      role="group"
      aria-label="Sneltoetsen"
    >
      <p v-for="hint in SIDEBAR_HINTS" :key="hint.keys" class="text-sm whitespace-nowrap text-muted">
        <kbd class="font-mono text-body">{{ hint.keys }}</kbd>{{ ' ' }}{{ hint.label }}
      </p>
    </div>

    <UserMenu />
  </aside>
</template>
