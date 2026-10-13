/**
 * Promise-based question for one line of text, replacing `window.prompt`.
 *
 * The sibling of `confirmAction()` (services/confirm.ts) and built the same
 * way: a module-level singleton, a host mounted once by the shell
 * (`PromptDialog`), and a call that reads like the native one it replaces.
 * The native prompt carries the origin in its title, cannot be styled, and
 * accepts an empty answer.
 *
 *   const name = await promptText({ title: 'Weergave opslaan', label: 'Naam' })
 *   if (!name) return
 *
 * Resolves with the trimmed text, or `null` when the user backs out. Never
 * with an empty string: the dialog does not offer its confirm button until
 * there is something to confirm.
 *
 * Named `promptText` rather than `prompt` on purpose: a forgotten import of a
 * function called `prompt` falls back to the browser's own.
 */

import { readonly, ref } from 'vue'

export interface PromptOptions {
  title: string
  /** The name of the text field, shown above it. */
  label: string
  /** Text the field starts with, e.g. the current name on a rename. */
  value?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
}

interface PendingPrompt extends PromptOptions {
  resolve: (value: string | null) => void
}

const pending = ref<PendingPrompt | null>(null)

/** Read by `PromptDialog`; `null` means nothing is being asked. */
export const currentPrompt = readonly(pending)

export function promptText(options: PromptOptions): Promise<string | null> {
  // As in `confirmAction`: a second question declines the one still open, so
  // its caller is not left awaiting forever.
  pending.value?.resolve(null)
  return new Promise<string | null>((resolve) => {
    pending.value = { ...options, resolve }
  })
}

export function resolvePrompt(value: string | null) {
  const current = pending.value
  pending.value = null
  current?.resolve(value)
}
