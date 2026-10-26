/**
 * The way back into Controle from the rapportage pages (#484).
 *
 * Closing a dossier in Controle opens the next one of the same list (`openNextDossier`). A dossier
 * whose rapportage still needs its addresses filled in by hand goes to the rapportage editor
 * instead, and the list used to be lost there: after filling in and offering the rapportage for
 * review, the invoerder had to find "Aan jou toegewezen" again for every such dossier. The editor
 * and the rapportage page now carry two query parameters along — the dossier, and the list it was
 * opened from (Controle's own query, kept as one string) — and offering the rapportage for review
 * opens the next dossier of that list.
 */
import type { LocationQuery, LocationQueryRaw, LocationQueryValue, Router } from 'vue-router'

import api from '@/services/fundermaps'
import { parseQuery, toQueueOpts } from '@/services/reviewExplorer'

export interface QueueReturn {
  dossierId: number
  /** Controle's query when the dossier was opened: filters, sort and view. */
  queue: LocationQuery
}

const DOSSIER = 'dossier'
const QUEUE = 'queue'

/** The query for a rapportage page opened from dossier `dossierId` in Controle. */
export function queueReturnQuery(dossierId: number, queue: LocationQuery): LocationQueryRaw {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(queue)) {
    for (const v of Array.isArray(value) ? value : [value]) if (v != null) params.append(key, v)
  }
  return { [DOSSIER]: String(dossierId), [QUEUE]: params.toString() }
}

/** The way back when this page was opened from Controle, else null. */
export function readQueueReturn(query: LocationQuery): QueueReturn | null {
  const dossierId = Number(first(query[DOSSIER]))
  if (!Number.isInteger(dossierId) || dossierId <= 0) return null
  const queue: LocationQuery = {}
  for (const [key, value] of new URLSearchParams(first(query[QUEUE]) ?? '')) {
    const had = queue[key]
    queue[key] = had == null ? value : Array.isArray(had) ? [...had, value] : [had, value]
  }
  return { dossierId, queue }
}

/** The same two parameters, passed on from one rapportage page to the next. */
export function keepQueueReturn(query: LocationQuery): LocationQueryRaw {
  const back = readQueueReturn(query)
  return back ? queueReturnQuery(back.dossierId, back.queue) : {}
}

/**
 * Straight on to the next one. Finishing a dossier is the end of a decision, not of a session: the
 * reviewer's next move is always "the next oldest", and a trip through the list between every two
 * dossiers is what breaks the pace (Yorick, 2026-08-29). Within the list the reviewer came from
 * (Don, 2026-09-14): the filter and sort ride along, so "next" means the next one of the same kind,
 * contractor or view — not the oldest open dossier overall. The list when there is no next one.
 */
export async function openNextDossier(router: Router, from: QueueReturn): Promise<void> {
  try {
    // Page and offset are dropped: the dossier just finished has left the list.
    const opts = { ...toQueueOpts(parseQuery(from.queue)), limit: 5, offset: 0 }
    const next = (await api.dataops.queue(opts)).find((r) => r.id !== from.dossierId)
    if (next) {
      await router.push({ name: 'review-dossier', params: { id: next.id }, query: from.queue })
      return
    }
  } catch {
    // Falling back to the list is fine; what came before already succeeded.
  }
  await router.push({ name: 'review-queue', query: from.queue })
}

function first(value: LocationQueryValue | LocationQueryValue[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null
}
