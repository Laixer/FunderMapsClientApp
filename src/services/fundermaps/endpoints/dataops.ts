import { get, post } from '../client'
import type {
  IReviewQueueItem,
  IReviewDossier,
  IVerdict,
  IDossierOutcome,
} from '../interfaces/IDataops'

export interface IQueueListOpts {
  limit?: number
  offset?: number
  q?: string
}

/**
 * Submissions waiting for a reviewer, oldest first. Same contract as
 * `inquiry.list`: the server pages and searches; the client never filters a
 * page it did not ask for.
 */
export async function queue(opts: IQueueListOpts = {}) {
  const queryString: Record<string, string> = {}
  if (opts.limit != null) queryString.limit = String(opts.limit)
  if (opts.offset != null) queryString.offset = String(opts.offset)
  if (opts.q) queryString.q = opts.q
  return (await get({ endpoint: '/dataops/queue', queryString })) as IReviewQueueItem[]
}

/** How long the line is, independent of any page. */
export async function queueCount() {
  return (await get({ endpoint: '/dataops/queue/stats' })) as { count: number }
}

/**
 * Close a dossier as a whole — the document is not about anything, or is a
 * duplicate. A per-field verdict cannot say that, and a dossier the pipeline
 * read nothing from has no fields to judge.
 */
export async function close(id: number, body: IDossierOutcome) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/outcome`,
    body: { ...body } as unknown as Record<string, unknown>,
  })) as { ok: boolean }
}

/** One submission: its documents, the page triage, and every proposed value. */
export async function dossier(id: number) {
  return (await get({ endpoint: `/dataops/dossier/${id}` })) as IReviewDossier
}

/**
 * Record a decision on a single field.
 *
 * Per field rather than per document on purpose: a document routinely yields
 * six values where five are solid and one is a stretch.
 */
export async function verdict(body: IVerdict) {
  return (await post({
    endpoint: '/dataops/verdict',
    body: { ...body } as unknown as Record<string, unknown>,
  })) as { ok: boolean }
}

/** Close many at once — one transaction server-side, so 30 logos never half-close. */
export async function closeMany(ids: number[], body: IDossierOutcome) {
  return (await post({
    endpoint: '/dataops/dossiers/outcome',
    body: { ids, ...body } as unknown as Record<string, unknown>,
  })) as { ok: boolean; closed: number }
}

/**
 * Commit: the confirmed values become a report.inquiry with one sample per
 * address, and the document enters the survey record. The end of the lane.
 */
export async function commit(id: number, body: { type?: string; documentDate?: string; note?: string } = {}) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/commit`,
    body: { ...body } as unknown as Record<string, unknown>,
  })) as { ok: boolean; inquiryId: number; samples: number; unresolved: string[] }
}

export default { queue, queueCount, dossier, verdict, close, closeMany, commit }
