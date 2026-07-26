/**
 * The dossiers you had open lately.
 *
 * Triage is not a single pass: you open a dossier, find it needs a document
 * you have to go and fetch, move on, and come back an hour later. Without a
 * record of where you have been, coming back means searching for something you
 * were looking at twenty minutes ago.
 *
 * Stored in `localStorage` rather than on the server: it is one person's
 * browsing trail on one machine, nobody else has any use for it, and the API
 * has nowhere to put it. It is also why this is safe to lose — a cleared
 * browser costs you a convenience, not a record.
 */

const KEY = 'studio:recents'

/** Enough to cover a morning, short enough to stay scannable in a side rail. */
const MAX = 6

export type RecentKind = 'inquiry' | 'recovery'

export interface RecentEntry {
  kind: RecentKind
  id: number
  label: string
  /** ISO timestamp of the visit. */
  at: string
}

function read(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Validated rather than trusted: this is user-writable storage, and a
    // half-written entry from an older shape would otherwise crash the rail
    // that renders it.
    return parsed.filter(
      (entry): entry is RecentEntry =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as RecentEntry).id === 'number' &&
        typeof (entry as RecentEntry).label === 'string' &&
        typeof (entry as RecentEntry).at === 'string' &&
        ((entry as RecentEntry).kind === 'inquiry' || (entry as RecentEntry).kind === 'recovery'),
    )
  } catch {
    return []
  }
}

export function recents(): RecentEntry[] {
  return read()
}

/**
 * Record a visit. Re-visiting a dossier moves it to the front rather than
 * adding a second row — the rail answers "where was I", not "how often".
 */
export function remember(kind: RecentKind, id: number, label: string): void {
  const entry: RecentEntry = { kind, id, label, at: new Date().toISOString() }
  const next = [entry, ...read().filter((e) => !(e.kind === kind && e.id === id))].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // A full or disabled localStorage costs the rail its contents and nothing
    // else. Never let it take a dossier page down with it.
  }
}

export function forgetAll(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // See above.
  }
}
