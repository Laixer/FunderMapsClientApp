/**
 * Inquiry shape returned by the TS API (camelCase + integer enums).
 * Mirrors `LegacyInquiry` in `~/Projects/FunderMapsApi/src/lib/inquiry-serializer.ts`.
 *
 * Status values (per behavioral spec):
 *   0 todo · 1 pending · 2 done · 3 discarded · 4 pending_review · 5 rejected
 *
 * Access values: 0 public · 1 private · 2 organization
 */

export interface IInquiry {
  id: number
  documentName: string
  inspection: boolean
  jointMeasurement: boolean
  floorMeasurement: boolean
  note: string | null
  documentDate: string
  documentFile: string
  type: number | null
  standardF3o: boolean
  attribution: IAttribution
  state: { auditStatus: number }
  access: { accessPolicy: number }
  record: {
    createDate: string | null
    updateDate: string | null
    deleteDate: string | null
  }
}

export interface IAttribution {
  reviewer: string
  reviewerName: string | null
  creator: string
  creatorName: string | null
  owner: string
  ownerName: string | null
  contractor: number
  contractorName: string | null
}

/** Body for POST/PUT /api/inquiry. */
export interface IInquiryInput {
  documentName: string
  inspection?: boolean
  jointMeasurement?: boolean
  floorMeasurement?: boolean
  note?: string | null
  documentDate: string
  documentFile: string
  type: number
  standardF3o?: boolean
  attribution: {
    reviewer: string
    contractor: number
  }
}
