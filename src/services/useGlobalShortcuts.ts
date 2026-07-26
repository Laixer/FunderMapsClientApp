/**
 * App-wide keyboard shortcuts, mounted once by the layout shell.
 *
 * Deliberately a single `keydown` listener rather than one per binding: the
 * `g`-prefix sequences need shared state (is a `g` armed?), and one listener
 * makes the "ignore this while typing" rule impossible to forget.
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { GOTO_ROUTES, isModalOpen, isTypingTarget, SEQUENCE_TIMEOUT_MS } from '@/services/shortcuts'
import { useStudioStore } from '@/stores/studio'

export function useGlobalShortcuts() {
  const router = useRouter()
  const studio = useStudioStore()
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
   * Focus the page's search box, if it has one. Located by type rather than
   * through a store or a ref chain: the list views render exactly one
   * `type="search"`, and a shortcut that silently does nothing on a page
   * without search is the correct behaviour anyway.
   */
  function focusSearch(): boolean {
    const el = document.querySelector<HTMLInputElement>('input[type="search"]')
    if (!el) return false
    el.focus()
    el.select()
    return true
  }

  function onKeydown(event: KeyboardEvent) {
    // ⌘K is the one binding that works everywhere, including from inside a text
    // field and with a dialog up — it is how you get out of wherever you are,
    // so it is checked before every other rule.
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      studio.togglePalette()
      return
    }

    if (event.key === 'Escape' && studio.paletteOpen) {
      event.preventDefault()
      studio.closePalette()
      return
    }

    // Never steal a keystroke that belongs to the browser or the OS.
    if (event.metaKey || event.ctrlKey || event.altKey) return

    // A dialog owns the keyboard while it is up. Escape still gets through, so
    // the overlay can close itself and Modal can close everything else.
    if (isModalOpen() && event.key !== 'Escape') return

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
