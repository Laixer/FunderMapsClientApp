import { ref } from 'vue'

import type { Tone } from '@/services/tone'

/**
 * Transient confirmations, and the failures behind optimistic writes.
 *
 * The studio writes optimistically — a saved field goes green before the server
 * has agreed — which is only honest if the app tells you when the server did
 * *not* agree. That is what this is for: success toasts are the exception,
 * failure toasts are the point.
 *
 * A module-level list rather than a store: toasts have no relationship to any
 * other state, and this way a service can raise one without reaching for Pinia
 * (`services/fundermaps` has no component context to install a store from).
 */

export interface Toast {
  id: number
  tone: Tone
  message: string
  /** Left up until dismissed. Used for anything the user has to act on. */
  sticky: boolean
}

export const toasts = ref<Toast[]>([])

/** Long enough to read a sentence, short enough not to sit in the way. */
const DEFAULT_TTL_MS = 5000

let nextId = 1

function push(tone: Tone, message: string, options?: { sticky?: boolean }): number {
  const id = nextId++
  const sticky = options?.sticky ?? false
  toasts.value = [...toasts.value, { id, tone, message, sticky }]
  if (!sticky) setTimeout(() => dismiss(id), DEFAULT_TTL_MS)
  return id
}

export function dismiss(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export function toastSuccess(message: string): number {
  return push('green', message)
}

/**
 * Something did not save. Sticky by default — a write that failed while the UI
 * already showed it as done is exactly the message that must not scroll past
 * while someone is looking at another pane.
 */
export function toastError(message: string): number {
  return push('red', message, { sticky: true })
}

export function toastInfo(message: string): number {
  return push('blue', message)
}
