/**
 * Page-level action shortcuts, declared as a map from key to handler.
 *
 * The global handler owns navigation; this owns *doing things* — approving,
 * saving, advancing a wizard. Kept separate because those bindings belong to
 * whichever view is mounted and must disappear with it: `⇧A` should approve a
 * dossier while you are looking at one and do nothing at all on the explorer.
 *
 * Keys are written the way the cheatsheet writes them, so the two cannot drift:
 *
 *   `⇧A`   Shift + A
 *   `⌘S`   Meta or Ctrl + S — whichever this keyboard has
 *   `⌘↵`   Meta or Ctrl + Enter
 *   `1`    a bare key
 *
 * A handler that returns without acting is fine; a binding whose action is
 * currently unavailable should simply not be registered, so the keystroke falls
 * through to the browser rather than being swallowed silently.
 */

import { onBeforeUnmount, onMounted, toValue, type MaybeRefOrGetter } from 'vue'

import { isModalOpen, isTypingTarget } from '@/services/shortcuts'

export type ActionMap = Record<string, () => void>

interface Binding {
  key: string
  shift: boolean
  mod: boolean
  run: () => void
}

/** Turn `⇧A` / `⌘↵` / `1` into something a KeyboardEvent can be matched against. */
function parse(spec: string, run: () => void): Binding {
  let rest = spec
  let shift = false
  let mod = false

  for (;;) {
    if (rest.startsWith('⇧')) {
      shift = true
      rest = rest.slice(1)
    } else if (rest.startsWith('⌘')) {
      mod = true
      rest = rest.slice(1)
    } else if (rest.startsWith('Ctrl+')) {
      mod = true
      rest = rest.slice(5)
    } else if (rest.startsWith('Ctrl')) {
      mod = true
      rest = rest.slice(4)
    } else {
      break
    }
  }

  const key = rest === '↵' ? 'enter' : rest.toLowerCase()
  return { key, shift, mod, run }
}

export function useActionShortcuts(actions: MaybeRefOrGetter<ActionMap>) {
  function onKeydown(event: KeyboardEvent) {
    if (isModalOpen()) return
    // A modified shortcut is safe to fire from inside a field — ⌘S while the
    // cursor sits in a sample field is exactly when you want it. A bare or
    // Shift-only one is not: ⇧A is a capital A.
    const modified = event.metaKey || event.ctrlKey
    if (!modified && isTypingTarget(event.target)) return
    if (event.altKey) return

    const pressed = event.key.toLowerCase()

    for (const [spec, run] of Object.entries(toValue(actions))) {
      const binding = parse(spec, run)
      if (binding.key !== pressed) continue
      if (binding.mod !== modified) continue
      // Shift is only *required* when the binding asks for it. Letters typed
      // with Shift already arrive uppercased, which `pressed` has normalised.
      if (binding.shift && !event.shiftKey) continue
      if (!binding.shift && event.shiftKey && binding.key.length === 1) continue

      event.preventDefault()
      binding.run()
      return
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
