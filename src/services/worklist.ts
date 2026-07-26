/**
 * What's on your plate, as a small set of named lanes.
 *
 * The inquiry list is a good table and a poor answer to "what should I do
 * today": it opens on the most recently touched 200 rows across the whole
 * organisation, which at 26k dossiers — 20,439 of them sitting in
 * `pending_review` — is a filing cabinet rather than a desk. Each lane below is
 * one question a person actually arrives with, expressed as filters the list
 * endpoint already supports.
 *
 * Inquiries only: `GET /api/recovery` takes `q`, `limit` and `offset` and no
 * status or attribution filters, so recoveries cannot be laned server-side.
 * With 14 recoveries in prod against 26,633 inquiries that is not worth an API
 * change; the sidebar link covers them.
 */

import type { IInquiryListOpts } from '@/services/fundermaps/endpoints/inquiry'
import { AUDIT_STATUS } from '@/services/inquiryEnums'

/** Which side of the dossier the lane puts you on. */
export type LaneRole = 'reviewer' | 'creator'

export interface Lane {
  key: string
  title: string
  /** Shown instead of a table when the lane is clear — good news, said plainly. */
  empty: string
  role: LaneRole
  statuses: number[]
  /**
   * Draw attention to a non-empty lane. Only `rejected` gets it: work waiting
   * on you is normal, work that came back is not.
   */
  urgent?: boolean
}

export const LANES: readonly Lane[] = [
  {
    key: 'review',
    title: 'Te controleren door jou',
    empty: 'Niks te controleren.',
    role: 'reviewer',
    statuses: [AUDIT_STATUS.PENDING_REVIEW],
  },
  {
    key: 'rejected',
    title: 'Afgekeurd — wacht op jou',
    empty: 'Geen afgekeurde rapportages.',
    role: 'creator',
    statuses: [AUDIT_STATUS.REJECTED],
    urgent: true,
  },
  {
    key: 'entry',
    title: 'Jouw invoer, nog niet aangeboden',
    empty: 'Geen openstaande invoer.',
    role: 'creator',
    statuses: [AUDIT_STATUS.TODO, AUDIT_STATUS.PENDING],
  },
]

/** How many rows a lane shows before it defers to the full list. */
export const LANE_PREVIEW = 8

/**
 * How many a lane fetches. Enough to report an exact count for any realistic
 * personal queue, and cheap enough to ask for three at once; past this the lane
 * says "50+" rather than pretending to know.
 */
export const LANE_FETCH = 50

export function laneQuery(lane: Lane, userId: string): IInquiryListOpts {
  return {
    status: lane.statuses,
    ...(lane.role === 'reviewer' ? { reviewer: userId } : { creator: userId }),
    limit: LANE_FETCH,
  }
}

/**
 * Route query that reproduces the lane in the full list view, so "alles
 * bekijken" lands on the same set rather than on everything.
 */
export function laneRouteQuery(lane: Lane): Record<string, string> {
  return { status: lane.statuses.join(','), mine: lane.role }
}

/**
 * Rows a lane actually shows. The rest stay behind the "+N meer" link — a lane
 * is a prompt to act, not a second copy of the list view.
 */
export function lanePreview<T>(rows: readonly T[]): T[] {
  return rows.slice(0, LANE_PREVIEW)
}

export function laneHiddenCount(rows: readonly unknown[]): number {
  return Math.max(0, rows.length - LANE_PREVIEW)
}

/**
 * The count badge. `LANE_FETCH` rows means "at least this many" — the query was
 * capped, so claiming an exact number would be a guess dressed as a fact.
 */
export function laneCountLabel(rows: readonly unknown[]): string {
  return rows.length >= LANE_FETCH ? `${LANE_FETCH}+` : String(rows.length)
}
