/**
 * `j` / `k` / `Enter` over a single-table list view.
 *
 * Triage is the job these views exist for, and triage is a rhythm: look, judge,
 * open, come back, next. Doing that with the mouse means re-finding your place
 * in a 200-row table every time.
 */

import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

import { isModalOpen, isTypingTarget } from '@/services/shortcuts'

export interface RowKeyboardOptions<T> {
  rows: Ref<T[]>
  /** Invoked on Enter with the highlighted row. */
  onOpen: (row: T) => void
  /** Identity used to drive the table's highlight. */
  idOf?: (row: T) => string | number
}

export function useRowKeyboard<T extends { id: string | number }>(options: RowKeyboardOptions<T>) {
  const { rows, onOpen, idOf = (row: T) => row.id } = options

  /** -1 means "nothing highlighted yet", which is how every list starts. */
  const activeIndex = ref(-1)

  /** Feeds `Table`'s `selectedId`, so the highlight is the table's own. */
  const activeId = ref<string | number | null>(null)

  // A new result set invalidates the position — keeping index 7 across a search
  // would highlight an unrelated row.
  watch(rows, () => {
    activeIndex.value = -1
    activeId.value = null
  })

  /**
   * Keep the highlighted row on screen, and take the keyboard focus along.
   *
   * Reaches for the row element by position rather than through a ref, because
   * `DataTable` renders its own rows and threading a ref array through the
   * slot API would complicate every other caller for one feature. The rows are
   * focusable grid rows (`role="row" tabindex="0"`); this used to look for
   * `table tbody tr`, which matches nothing since the table became a grid, so
   * the highlight could walk off screen.
   *
   * Focus follows the highlight so that Enter belongs to the highlighted row:
   * left on a row that was clicked earlier, Enter opened that one instead.
   */
  function scrollActiveIntoView() {
    if (activeIndex.value < 0) return
    const row = document.querySelectorAll<HTMLElement>('[role="row"][tabindex="0"]')[activeIndex.value]
    if (!row) return
    row.focus({ preventScroll: true })
    row.scrollIntoView({ block: 'nearest' })
  }

  function move(delta: number) {
    if (!rows.value.length) return
    const next = activeIndex.value + delta
    // Stop at the ends rather than wrapping: wrapping from the last row to the
    // first reads as a glitch when you are holding `j` down.
    activeIndex.value = Math.max(0, Math.min(rows.value.length - 1, next < 0 ? 0 : next))
    const row = rows.value[activeIndex.value]
    activeId.value = row ? idOf(row) : null
    requestAnimationFrame(scrollActiveIntoView)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (isModalOpen()) return
    if (isTypingTarget(event.target)) return

    switch (event.key) {
      case 'j':
        event.preventDefault()
        move(1)
        return
      case 'k':
        event.preventDefault()
        move(-1)
        return
      case 'Enter': {
        const row = rows.value[activeIndex.value]
        if (!row) return
        event.preventDefault()
        onOpen(row)
        return
      }
      case 'Escape':
        activeIndex.value = -1
        activeId.value = null
        return
    }
  }

  /**
   * A row picked with the mouse is where the keyboard carries on from: Enter
   * opens it and `j` moves on from it. Without this the cursor only knew the
   * rows it had been walked to with j/k, so after a click Enter did nothing and
   * `j` jumped back to the first row.
   */
  function setActive(id: string | number | null) {
    const index = id === null ? -1 : rows.value.findIndex((row) => idOf(row) === id)
    activeIndex.value = index
    activeId.value = index < 0 ? null : id
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

  return { activeId, activeIndex, setActive }
}
