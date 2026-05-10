/**
 * Recovery shape returned by the TS API (camelCase + integer enums).
 * Mirrors `LegacyRecovery` in `~/Projects/FunderMapsApi/src/lib/recovery-serializer.ts`.
 *
 * Status values match the inquiry state machine (audit_status):
 *   0 todo · 1 pending · 2 done · 3 discarded · 4 pending_review · 5 rejected
 *
 * Access values: 0 public · 1 private
 *
 * Type values (recovery_document_type): 0 permit · 1 foundation_report ·
 * 2 archive_report · 3 owner_evidence · 4 unknown
 */

import type { IAttribution } from './IInquiry'

export interface IRecovery {
  id: number
  documentName: string
  note: string | null
  documentDate: string
  documentFile: string
  type: number | null
  attribution: IAttribution
  state: { auditStatus: number }
  access: { accessPolicy: number }
  record: {
    createDate: string | null
    updateDate: string | null
    deleteDate: string | null
  }
}

/** Body for POST/PUT /api/recovery. */
export interface IRecoveryInput {
  documentName: string
  note?: string | null
  documentDate: string
  documentFile: string
  type: number
  attribution: {
    reviewer: string
    contractor: number
  }
}
