/**
 * The panden you looked at last, in this browser (2026-10-22, the Panden
 * finder): opening a Pand page remembers it, the finder lists them. A
 * convenience, not a record: storage may be empty, blocked or wiped, and the
 * page works the same without it.
 */

const KEY = 'studio:recent-panden'
const MAX = 8

export interface RecentPand {
  /** The BAG pand id. */
  id: string
  title: string
  /** Postcode and place, or the municipality. */
  place: string
  at: string
}

function read(): RecentPand[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Validated rather than trusted: user-writable storage.
    return parsed.filter(
      (e): e is RecentPand =>
        !!e &&
        typeof e === 'object' &&
        typeof (e as RecentPand).id === 'string' &&
        typeof (e as RecentPand).title === 'string' &&
        typeof (e as RecentPand).place === 'string' &&
        typeof (e as RecentPand).at === 'string',
    )
  } catch {
    return []
  }
}

export function recentPanden(): RecentPand[] {
  return read()
}

export function rememberPand(id: string, title: string, place: string): void {
  const entry: RecentPand = { id, title, place, at: new Date().toISOString() }
  const next = [entry, ...read().filter((e) => e.id !== id)].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* no storage: nothing to remember, nothing broken */
  }
}
