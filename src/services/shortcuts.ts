import { ref } from 'vue'

import { GOTO_ROUTES } from '@/services/navigation'

/**
 * Keyboard shortcuts, declared once.
 *
 * Ad, Ton, Yorick and Don live in this app all day; reaching for the mouse to
 * change page, focus the search box or approve a dossier is a tax paid hundreds
 * of times. The bindings below are the ones worth muscle memory — and because
 * they are declared rather than scattered through handlers, the sidebar
 * cheatsheet, the help overlay and the command palette are all generated from
 * the same list that implements them, so they cannot drift.
 *
 * Two conventions: `g` + a Dutch initial jumps somewhere (`g r` is
 * *rapportages*, `g h` is *herstel*), and anything that writes takes a modifier
 * or Shift (`⌘S` save, `⇧A` approve) so it can never fire from a stray keypress.
 */

export interface Shortcut {
  /** Rendered in the overlay; a space means "then", as in `g` then `w`. */
  keys: string
  label: string
}

export interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

export { GOTO_ROUTES }

/**
 * Whether this machine uses ⌘ rather than Ctrl. Read once — a keyboard does
 * not change mid-session, and the value is baked into rendered labels.
 */
export const IS_APPLE =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '')

/** The modifier this user is actually looking at on their own keyboard. */
export const MOD = IS_APPLE ? '⌘' : 'Ctrl+'

/**
 * Render a binding for display.
 *
 * Bindings are written the Mac way everywhere in the code (`⌘S`, `⌘↵`) because
 * one canonical spelling keeps the handler, the cheatsheet and the button hint
 * in step. This is the one place that translates: a ⌘ on a keyboard that has no
 * ⌘ key is a shortcut nobody tries.
 */
export function keyLabel(spec: string): string {
  return spec.replace('⌘', MOD)
}

/** The three worth pinning to the sidebar. The rest live behind `?`. */
export const SIDEBAR_HINTS: readonly Shortcut[] = [
  { keys: 'J', label: 'Volgende dossier' },
  { keys: '⇧A', label: 'Goedkeuren' },
  { keys: keyLabel('⌘S'), label: 'Opslaan' },
]

export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    title: 'Navigatie',
    shortcuts: [
      { keys: keyLabel('⌘K'), label: 'Zoeken of springen' },
      ...Object.entries(GOTO_ROUTES).map(([key, { label }]) => ({
        keys: `g ${key}`,
        label,
      })),
    ],
  },
  {
    title: 'Lijst',
    shortcuts: [
      { keys: '/', label: 'Zoeken' },
      { keys: 'j', label: 'Volgende rij' },
      { keys: 'k', label: 'Vorige rij' },
      { keys: 'Enter', label: 'Geselecteerde rij openen' },
    ],
  },
  {
    title: 'Dossier',
    shortcuts: [
      { keys: '⇧E', label: 'Bewerken' },
      { keys: '⇧S', label: 'Aanbieden ter review' },
      { keys: '⇧A', label: 'Goedkeuren' },
      { keys: '⇧R', label: 'Afkeuren' },
    ],
  },
  {
    title: 'Invoer',
    shortcuts: [
      { keys: keyLabel('⌘S'), label: 'Nu opslaan' },
      { keys: keyLabel('⌘↵'), label: 'Volgende stap' },
      { keys: '?', label: 'Dit overzicht' },
      { keys: 'Esc', label: 'Sluiten of focus loslaten' },
    ],
  },
]

/**
 * Whether a keystroke should be left alone.
 *
 * Typing "j" into the search box must type a j, not jump a row — so every
 * handler checks this first. `isContentEditable` covers the rich-text case even
 * though nothing here uses one yet; it costs a property read.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true
}

/**
 * How long a `g` stays armed waiting for its second key. Long enough to be
 * unhurried, short enough that a stray `g` does not hijack a later keystroke.
 */
export const SEQUENCE_TIMEOUT_MS = 1200

/**
 * How many modals are currently on screen.
 *
 * `Modal` bumps this on mount and releases it on unmount, so every dialog in the
 * app — confirm, reject, the shortcut overlay itself — gets the same treatment
 * without opting in. Without it, pressing `j` behind an open dialog would move
 * the selection in the table underneath.
 */
const openModals = ref(0)

export function acquireModalLock(): () => void {
  openModals.value++
  let released = false
  return () => {
    // Idempotent: a double release would let the count drift below zero and
    // wedge the shortcuts on permanently.
    if (released) return
    released = true
    openModals.value--
  }
}

export function isModalOpen(): boolean {
  return openModals.value > 0
}
