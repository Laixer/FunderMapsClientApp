/**
 * Where a sample field's value came from.
 *
 * Adding an address to an inquiry prefills the new sample from the one
 * currently selected (`InquiryStep2.handlePick`), which saves a great deal of
 * retyping on a terrace of near-identical houses — but until now left no trace,
 * so a reviewer could not tell a value observed at this address from one that
 * rode along from the previous one. This records that distinction.
 *
 * `FieldSource` deliberately has no `human` variant: **absence of an entry
 * means human-authored**. Keeping the default state unrepresented keeps the
 * payload small and means every sample written before this existed reads
 * correctly as typed-by-a-person rather than unknown.
 */

import type { IInquirySampleInput } from '@/services/fundermaps/interfaces/IInquirySample'

export type FieldSource =
  /** Copied from another sample in the same inquiry when the address was added. */
  | { kind: 'inherited'; fromSampleId: number; fromAddress: string }
  /**
   * Extracted from a document by the Data Ops pipeline. Not produced yet —
   * declared so the reviewer UI is built against the shape it will carry.
   */
  | {
      kind: 'proposed'
      producer: string
      confidence: number
      citation?: { artifactId: string; page: number; snippet: string }
    }

export interface FieldProvenance {
  source: FieldSource
  /** Set once a reviewer has explicitly kept the value. */
  confirmedAt?: string
  confirmedBy?: string
}

/** Provenance is only ever recorded for fields the user can edit. */
export type ProvenanceKey = keyof IInquirySampleInput

export type SampleProvenance = Partial<Record<ProvenanceKey, FieldProvenance>>

/** `address` identifies the sample rather than describing it — never inherited. */
const NEVER_TRACKED: ReadonlySet<string> = new Set(['address'])

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}

/**
 * Mark every field the clone actually carried a value into.
 *
 * Only fields that arrived with a value are recorded: badging the forty empty
 * inputs a clone also copies would bury the handful that matter.
 */
export function inheritedFrom(
  payload: IInquirySampleInput,
  from: { id: number; address: string },
): SampleProvenance {
  const provenance: SampleProvenance = {}
  for (const [key, value] of Object.entries(payload)) {
    if (NEVER_TRACKED.has(key) || !hasValue(value)) continue
    provenance[key as ProvenanceKey] = {
      source: { kind: 'inherited', fromSampleId: from.id, fromAddress: from.address },
    }
  }
  return provenance
}

export function isConfirmed(entry: FieldProvenance | undefined): boolean {
  return entry?.confirmedAt != null
}

/** Needs a look from the reviewer: carried over and not yet acknowledged. */
export function needsReview(entry: FieldProvenance | undefined): boolean {
  return entry !== undefined && !isConfirmed(entry)
}

export function confirm(entry: FieldProvenance, by: string | null): FieldProvenance {
  return {
    ...entry,
    confirmedAt: new Date().toISOString(),
    ...(by ? { confirmedBy: by } : {}),
  }
}

/** Counts for a section header: how many of these fields carried over, and how many still need a look. */
export function summarise(
  provenance: SampleProvenance,
  keys: readonly string[],
): { tracked: number; unconfirmed: number } {
  let tracked = 0
  let unconfirmed = 0
  for (const key of keys) {
    const entry = provenance[key as ProvenanceKey]
    if (!entry) continue
    tracked++
    if (!isConfirmed(entry)) unconfirmed++
  }
  return { tracked, unconfirmed }
}
