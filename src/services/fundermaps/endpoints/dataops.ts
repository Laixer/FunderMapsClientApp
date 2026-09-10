import { get, post } from '../client'
import type {
  IReviewQueueItem,
  IReviewDossier,
  IVerdict,
  IDossierOutcome,
} from '../interfaces/IDataops'

export type QueueChannel = 'upload' | 'email' | 'bulk_drop' | 'api' | 'invoer_app' | 'audit'
export type QueueState = 'unread' | 'empty' | 'proposals'
export type QueueSort = 'received_at' | 'open' | 'files' | 'subject' | 'id'

/** Same contract as `IInquiryListOpts`: sets are OR within, AND across; every filter is server-side. */
export interface IQueueListOpts {
  limit?: number
  offset?: number
  q?: string
  channel?: QueueChannel[]
  state?: QueueState[]
  /** Received more than a week ago. */
  age?: 'overdue'
  building?: 'resolved' | 'unresolved'
  /** `report.inquiry_type` codes as the pipeline read them. */
  kind?: string[]
  sort?: QueueSort
  order?: 'asc' | 'desc'
}

function queueQueryString(opts: IQueueListOpts): Record<string, string> {
  const queryString: Record<string, string> = {}
  if (opts.limit != null) queryString.limit = String(opts.limit)
  if (opts.offset != null) queryString.offset = String(opts.offset)
  if (opts.q) queryString.q = opts.q
  if (opts.channel?.length) queryString.channel = opts.channel.join(',')
  if (opts.state?.length) queryString.state = opts.state.join(',')
  if (opts.age) queryString.age = opts.age
  if (opts.building) queryString.building = opts.building
  if (opts.kind?.length) queryString.kind = opts.kind.join(',')
  if (opts.sort) queryString.sort = opts.sort
  if (opts.order) queryString.order = opts.order
  return queryString
}

/**
 * Submissions waiting for a reviewer, oldest first unless asked otherwise.
 * Same contract as `inquiry.list`: the server pages, searches and filters;
 * the client never filters a page it did not ask for.
 */
export async function queue(opts: IQueueListOpts = {}) {
  return (await get({ endpoint: '/dataops/queue', queryString: queueQueryString(opts) })) as IReviewQueueItem[]
}

/** How long the line is, independent of any page. With filters: how long the filtered line is. */
export async function queueCount(opts: Omit<IQueueListOpts, 'limit' | 'offset' | 'sort' | 'order'> = {}) {
  return (await get({ endpoint: '/dataops/queue/stats', queryString: queueQueryString(opts) })) as {
    count: number
  }
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
export async function commit(
  id: number,
  body: { type?: string; documentDate?: string; contractor?: number; note?: string } = {},
) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/commit`,
    body: { ...body } as unknown as Record<string, unknown>,
  })) as {
    ok: boolean
    inquiryId: number
    samples: number
    /** `pending` when no sample was written: the record is still to be filled by hand. */
    auditStatus: 'done' | 'pending'
    /** True when the dossier was a nalezing: the rapportage was updated, not created. */
    audit?: boolean
    /** On a nalezing: how many values were written. */
    fields?: number
    unresolved: string[]
  }
}

/**
 * The staff front door: one or more documents become a dossier, the pipeline
 * reads them (kicked at once; the hourly sweep is the safety net) and the
 * reviewer continues in /review/:id. What kind of document it is, the pipeline
 * reads off the page itself (inquiry_type, with a citation); `category` stays
 * for a caller that knows.
 */
export async function create(
  files: File[],
  meta: { subject?: string; category?: string; building?: string | null },
) {
  const form = new FormData()
  for (const f of files) form.append('input', f)
  if (meta.category) form.append('category', meta.category)
  if (meta.subject) form.append('subject', meta.subject)
  if (meta.building) form.append('building', meta.building)
  return (await post({ endpoint: '/dataops/dossier', body: form })) as {
    id: number
    reference: string
    files: number
    /** Whether the pipeline was kicked now. False = the hourly sweep will read it. */
    reading: boolean
  }
}

/** A reviewer's internal note on the dossier — lands on the timeline, never mailed. */
export async function remark(id: number, text: string) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/remark`,
    body: { text } as unknown as Record<string, unknown>,
  })) as { ok: boolean }
}

/** A question to the melder — mailed via Resend, answered by reply straight into the timeline. */
export async function question(id: number, text: string) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/question`,
    body: { text } as unknown as Record<string, unknown>,
  })) as { ok: boolean }
}

export default { queue, queueCount, dossier, verdict, close, closeMany, commit, create, remark, question }
