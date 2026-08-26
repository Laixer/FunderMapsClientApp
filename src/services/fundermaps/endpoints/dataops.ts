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

export default { queue, queueCount, dossier, verdict, close }
