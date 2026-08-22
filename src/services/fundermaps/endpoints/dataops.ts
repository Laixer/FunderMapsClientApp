import { get, post } from '../client'
import type {
  IReviewQueueItem,
  IReviewDossier,
  IVerdict,
} from '../interfaces/IDataops'

/** Submissions waiting for a reviewer, oldest first. */
export async function queue() {
  return (await get({ endpoint: '/dataops/queue' })) as IReviewQueueItem[]
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

export default { queue, dossier, verdict }
