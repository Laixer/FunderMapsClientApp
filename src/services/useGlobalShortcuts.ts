/**
 * App-wide keyboard shortcuts, mounted once by the layout shell.
 *
 * Deliberately a single `keydown` listener rather than one per binding: the
 * `g`-prefix sequences need shared state (is a `g` armed?), and one listener
 * makes the "ignore this while typing" rule impossible to forget.
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { GOTO_ROUTES, isTypingTarget, SEQUENCE_TIMEOUT_MS } from '@/services/shortcuts'

export function useGlobalShortcuts() {
  const router = useRouter()
  const showShortcuts = ref(false)

  /** Set while a `g` is armed, cleared on use or on timeout. */
  let pendingGoto = false
  let gotoTimer: ReturnType<typeof setTimeout> | null = null

  function disarm() {
    pendingGoto = false
    if (gotoTimer) {
      clearTimeout(gotoTimer)
      gotoTimer = null
    }
  }

  function arm() {
    pendingGoto = true
    if (gotoTimer) clearTimeout(gotoTimer)
    gotoTimer = setTimeout(disarm, SEQUENCE_TIMEOUT_MS)
  }

  /**
   * Focus the page's search box, if it has one. Located by id rather than by a
   * store or a ref chain: the list views already give theirs a stable id, and a
   * shortcut that silently does nothing on a page without search is the correct
   * behaviour anyway.
   */
  function focusSearch(): boolean {
    const el = document.querySelector<HTMLInputElement>('input[type="search"]')
    if (!el) return false
    el.focus()
    el.select()
    return true
  }

  function onKeydown(event: KeyboardEvent) {
    // Never steal a keystroke from a text field, and never from a shortcut that
    // belongs to the browser or the OS.
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (isTypingTarget(event.target)) {
      // One exception: Escape gives the field back, which is how you get from
      // the search box to the row shortcuts without reaching for the mouse.
      if (event.key === 'Escape') (event.target as HTMLElement).blur()
      return
    }

    if (pendingGoto) {
      const target = GOTO_ROUTES[event.key.toLowerCase()]
      disarm()
      if (target) {
        event.preventDefault()
        router.push({ name: target.route })
      }
      return
    }

    switch (event.key) {
      case 'g':
        arm()
        return
      case '?':
        event.preventDefault()
        showShortcuts.value = !showShortcuts.value
        return
      case '/':
        // Only swallow the keystroke if there was in fact a search box to focus;
        // otherwise leave Firefox's quick-find alone.
        if (focusSearch()) event.preventDefault()
        return
      case 'Escape':
        showShortcuts.value = false
        return
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    disarm()
  })

  return { showShortcuts }
}
