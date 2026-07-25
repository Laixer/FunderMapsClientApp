/**
 * Keyboard shortcuts, declared once.
 *
 * Ad, Ton, Yorick and Don live in this app all day; reaching for the mouse to
 * change page or focus the search box is a tax paid hundreds of times. The
 * bindings below are the ones worth muscle memory — and because they are
 * declared rather than scattered through handlers, the help overlay is
 * generated from the same list that implements them, so it cannot drift.
 *
 * Dutch mnemonics on purpose: the UI is Dutch, so `g r` is *rapportages* and
 * `g h` is *herstel*. Choosing `g r`/`g h` over English initials keeps the two
 * that sit next to each other in the sidebar distinct.
 */

export interface Shortcut {
  /** Rendered in the overlay; a space means "then", as in `g` then `v`. */
  keys: string
  label: string
}

export interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

/** Route each `g` sequence jumps to. Also the source of the overlay's list. */
export const GOTO_ROUTES: Record<string, { route: string; label: string }> = {
  v: { route: 'home', label: 'Vandaag' },
  r: { route: 'inquiry-list', label: 'Rapportages' },
  h: { route: 'recovery-list', label: 'Herstel' },
}

export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    title: 'Navigatie',
    shortcuts: Object.entries(GOTO_ROUTES).map(([key, { label }]) => ({
      keys: `g ${key}`,
      label,
    })),
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
    title: 'Algemeen',
    shortcuts: [
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
