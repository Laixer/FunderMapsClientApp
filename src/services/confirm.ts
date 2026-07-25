/**
 * Promise-based confirmation, replacing `window.confirm`.
 *
 * The app asked twelve important questions — approve, reject, reopen, delete a
 * dossier, delete an address — through the browser's native dialog: unstyleable,
 * prefixed with the origin ("clientapp.fundermaps.com says:"), and unable to
 * show any context beyond a single line. Deleting a dossier takes its addresses
 * with it, and the native dialog had no way to say how many.
 *
 * A module-level singleton rather than a component per call site: twelve
 * `<ConfirmDialog v-if=…>` blocks with their own refs is a lot of ceremony for a
 * yes/no, and keeping the call shape close to `confirm()` means the call sites
 * read the way they always did.
 *
 *   if (!(await confirmAction({ title: 'Rapport goedkeuren?' }))) return
 */

import { readonly, ref } from 'vue'

export interface ConfirmOptions {
  title: string
  /** Optional second line: the consequence, or what exactly is affected. */
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button, for anything that destroys or cannot be undone. */
  danger?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

const pending = ref<PendingConfirm | null>(null)

/** Read by `ConfirmDialog`; `null` means nothing is being asked. */
export const currentConfirm = readonly(pending)

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  // A second question while one is open would strand the first promise
  // unresolved and leak whatever the caller was awaiting. Decline the older one.
  pending.value?.resolve(false)
  return new Promise<boolean>((resolve) => {
    pending.value = { ...options, resolve }
  })
}

export function resolveConfirm(value: boolean) {
  const current = pending.value
  pending.value = null
  current?.resolve(value)
}
