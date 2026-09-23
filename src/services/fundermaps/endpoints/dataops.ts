import { get, post } from '../client'
import type {
  IReviewQueueItem,
  IReviewDossier,
  IVerdict,
  IDossierOutcome,
  IDossierAddress,
  AddressVerdictOutcome,
} from '../interfaces/IDataops'

export type QueueChannel = 'upload' | 'email' | 'bulk_drop' | 'api' | 'invoer_app' | 'audit'
export type QueueState = 'unread' | 'empty' | 'proposals' | 'replied' | 'question'
/** How a dossier was closed. Asking for one lists the closed instead of the desk. */
export type QueueOutcome = 'rejected' | 'duplicate' | 'no_data' | 'accepted'
export type QueueSort = 'received_at' | 'outcome_at' | 'open' | 'files' | 'subject' | 'id'

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
  /** Closed dossiers with these outcomes, instead of the open desk. */
  outcome?: QueueOutcome[]
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
  if (opts.outcome?.length) queryString.outcome = opts.outcome.join(',')
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

/**
 * Undo a verdict while the dossier is open (#355): the field is pending again
 * and the earlier decision stays in the log. 409 once the dossier is closed.
 */
export async function reopenField(fieldId: number) {
  return (await post({ endpoint: `/dataops/field/${fieldId}/reopen`, body: {} })) as { ok: boolean }
}

/**
 * A value the reviewer saw and the model did not: lands as a confirmed proposal
 * on the dossier with a "human added" finding, so the commit takes it and the
 * pipeline learns it missed something (Don's casus 2, 2026-09-15).
 */
export async function addValue(dossierId: number, body: { field: string; value: string; addressId?: string | null; note?: string | null }) {
  return (await post({
    endpoint: `/dataops/dossier/${dossierId}/value`,
    body: { ...body } as unknown as Record<string, unknown>,
  })) as { ok: boolean; fieldId: number }
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
    /** Samples written for a confirmed address without values: to be filled in by hand. */
    emptySamples?: number
    /** Confirmed values that were dropped because their address was rejected. */
    skippedRejected?: number
    /** `pending` when no sample was written, or an empty one: the record is still to be filled by hand. */
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

/* ----------------------------------------------------- addresses (#333 C) */

type AddressReply = { ok: boolean; addresses: IDossierAddress[] }

/**
 * Confirm or reject an address of the dossier, or take that back. Rejecting
 * supersedes the open values under it; `pending` brings exactly those back.
 * An unresolved address is addressed by its text and can only be rejected.
 */
export async function addressVerdict(
  id: number,
  body: { addressId?: string; addressText?: string; outcome: AddressVerdictOutcome; note?: string | null },
) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/address/verdict`,
    body: { ...body } as unknown as Record<string, unknown>,
  })) as AddressReply
}

/** An address the document names but the pipeline missed. Confirmed at once; a sample on commit. */
export async function addressAdd(id: number, body: { addressId: string; note?: string | null }) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/address`,
    body: { ...body } as unknown as Record<string, unknown>,
  })) as AddressReply
}

/**
 * Move values to another address: the whole group (`addressId` or the
 * unresolved `addressText`) or a few by `fieldIds`. The target becomes a
 * confirmed address of the dossier.
 */
export async function addressRelink(
  id: number,
  body: { to: string; fieldIds?: number[]; addressId?: string; addressText?: string },
) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/address/relink`,
    body: { ...body } as unknown as Record<string, unknown>,
  })) as AddressReply & { moved: number }
}

/** Correct the pand the dossier was filed under. */
export async function setBuilding(id: number, addressId: string) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/building`,
    body: { addressId },
  })) as AddressReply
}

/**
 * Herstel vastleggen (#341): report.recovery + one sample per pand, with the
 * dossier's document. Enum values are the database labels. Does not close the
 * dossier.
 */
export async function recordRecovery(
  id: number,
  body: {
    documentType: string
    documentDate: string
    contractor?: number | null
    note?: string | null
    samples: {
      building: string
      type: string
      status?: string | null
      pileType?: string | null
      facade?: string[] | null
      recoveryDate?: string | null
      permit?: string | null
      permitDate?: string | null
      note?: string | null
    }[]
  },
) {
  return (await post({
    endpoint: `/dataops/dossier/${id}/recovery`,
    body: { ...body } as unknown as Record<string, unknown>,
  })) as { ok: boolean; recoveryId: number; samples: number; auditStatus: 'done' | 'pending' }
}

export default {
  queue,
  queueCount,
  dossier,
  verdict,
  reopenField,
  close,
  closeMany,
  commit,
  recordRecovery,
  create,
  remark,
  question,
  addressVerdict,
  addressAdd,
  addressRelink,
  setBuilding,
  addValue,
}
