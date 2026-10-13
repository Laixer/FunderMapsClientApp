<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'

import {
  actionItems,
  navigationItems,
  recordItems,
  type PaletteAction,
  type PaletteItem,
} from '@/services/palette'
import { trapFocus } from '@/services/focusTrap'
import { acquireModalLock } from '@/services/shortcuts'
import { useStudioStore } from '@/stores/studio'

/**
 * ⌘K — one box that reaches everything.
 *
 * Navigation, records and actions in one list, because from the keyboard they
 * are the same gesture. Records come from the server-side search, debounced,
 * while navigation and actions filter locally and appear instantly — so the
 * list is never empty while a request is in flight.
 *
 * The 140ms fade is the only animation in the studio. It exists because the
 * palette appears over content rather than replacing it, and a sheet that
 * simply blinks into existence reads as a rendering glitch.
 */
const router = useRouter()
const studio = useStudioStore()

// "Nieuwe rapportage" and "Nieuw herstel" are already in the navigation list
// with the same key; listed here as well they showed up twice under one query.
const ACTIONS: PaletteAction[] = []

const query = ref('')
const debouncedQuery = refDebounced(query, 180)
const records = ref<PaletteItem[]>([])
const searching = ref(false)
const cursor = ref(0)
const input = ref<HTMLInputElement | null>(null)
const panel = ref<HTMLElement | null>(null)

const items = computed<PaletteItem[]>(() => [
  ...navigationItems(query.value),
  ...records.value,
  ...actionItems(query.value, ACTIONS),
])

/**
 * Every search is tagged, and only the newest one may write. Without this a
 * slow request for "gild" can land after a fast one for "gildeweg 3" and put
 * the wrong list under the cursor.
 */
let searchToken = 0

// The moment the text changes, the records under it belong to another question.
// Left in place for the 180 ms debounce plus the request, Enter opened the
// previous query's first hit.
watch(query, (q) => {
  records.value = []
  searching.value = q.trim().length >= 2
})

watch(debouncedQuery, async (q) => {
  const token = ++searchToken
  if (q.trim().length < 2) {
    records.value = []
    searching.value = false
    return
  }
  searching.value = true
  const found = await recordItems(q)
  if (token !== searchToken) return
  records.value = found
  searching.value = false
})

// A new result set invalidates the cursor — keeping index 4 across a query
// change would highlight an unrelated row.
watch(items, () => {
  cursor.value = 0
})

let releaseModalLock: (() => void) | null = null
let releaseFocus: (() => void) | null = null

watch(
  () => studio.paletteOpen,
  async (open) => {
    if (open) {
      query.value = ''
      records.value = []
      cursor.value = 0
      // The palette holds the keyboard while it is up, so `j` does not scroll
      // the table behind it. Released the moment it closes.
      releaseModalLock = acquireModalLock()
      await nextTick()
      // Focus goes to the box (data-autofocus), Tab stays in the sheet, and on
      // closing the focus returns to where it was.
      if (panel.value) releaseFocus = trapFocus(panel.value)
      else input.value?.focus()
    } else {
      releaseModalLock?.()
      releaseModalLock = null
      releaseFocus?.()
      releaseFocus = null
    }
  },
)

function move(delta: number) {
  if (!items.value.length) return
  const next = cursor.value + delta
  // Wraps, unlike the table's j/k: the list is short enough to see whole, so
  // wrapping reads as a loop rather than as a glitch.
  cursor.value = (next + items.value.length) % items.value.length
}

function choose(item: PaletteItem | undefined) {
  if (!item) return
  studio.closePalette()
  if (item.to) router.push(item.to)
  item.run?.()
}
</script>

<template>
  <div
    v-if="studio.paletteOpen"
    class="fixed inset-0 z-40 flex justify-center bg-ink/35 pt-[12vh] backdrop-blur-[2px]"
    @click.self="studio.closePalette()"
  >
    <div
      ref="panel"
      class="studio-fade h-fit w-[560px] overflow-hidden rounded-3xl border border-line bg-surface shadow-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Zoeken of springen"
    >
      <div class="flex items-center gap-2.5 border-b border-divider px-4 py-3">
        <span aria-hidden="true" class="text-faint">⌕</span>
        <input
          ref="input"
          v-model="query"
          type="text"
          class="studio-control text-[14px]"
          placeholder="Rapportage, herstel, pand-ID of actie…"
          aria-label="Zoeken of springen"
          role="combobox"
          aria-controls="palette-list"
          :aria-expanded="items.length > 0"
          :aria-activedescendant="items[cursor] ? `palette-option-${cursor}` : undefined"
          data-autofocus
          autocomplete="off"
          spellcheck="false"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="choose(items[cursor])"
        />
        <kbd class="text-2xs rounded-xs border border-line px-1.5 py-px font-mono text-faint">
          Esc
        </kbd>
      </div>

      <div id="palette-list" role="listbox" aria-label="Resultaten" class="max-h-[52vh] overflow-y-auto p-2">
        <button
          v-for="(item, i) in items"
          :id="`palette-option-${i}`"
          :key="item.id"
          type="button"
          role="option"
          :aria-selected="i === cursor"
          class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left"
          :class="i === cursor ? 'bg-canvas' : 'hover:bg-canvas'"
          @click="choose(item)"
          @mousemove="cursor = i"
        >
          <span
            class="text-2xs shrink-0 rounded-sm bg-canvas px-1.5 py-0.5 font-mono text-subtle"
            :class="i === cursor && 'bg-white'"
          >
            {{ item.kind }}
          </span>
          <span class="text-lg min-w-0 flex-1 truncate font-semibold text-body">
            {{ item.label }}
          </span>
          <span v-if="item.hint" class="text-xs shrink-0 font-mono text-label">{{ item.hint }}</span>
        </button>

        <p v-if="searching" class="text-md px-2.5 py-2 text-muted">Zoeken…</p>
        <!-- One letter searches the screens and actions only; records need two. -->
        <p v-else-if="!items.length && query.trim().length === 1" class="text-md px-2.5 py-2 text-muted">
          Typ minstens 2 tekens om rapportages en herstel te zoeken.
        </p>
        <p v-else-if="!items.length" class="text-md px-2.5 py-2 text-muted">
          Niets gevonden voor “{{ query }}”.
        </p>
      </div>
    </div>
  </div>
</template>
