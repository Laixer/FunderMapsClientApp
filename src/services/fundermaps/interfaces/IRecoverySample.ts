/**
 * Recovery sample shape returned by the TS API (camelCase + integer enums).
 * Mirrors `toLegacyRecoverySample` in
 * `~/Projects/FunderMapsApi/src/lib/recovery-serializer.ts`.
 *
 * `building` is the BAG PAND id (resolved server-side from the input
 * `address` field, which can be a gfm-* / NUMMERAANDUIDING / PAND id).
 * Unlike inquiry samples, recovery samples store only building_id — no
 * per-address row.
 *
 * Enum values:
 *   status (recovery_status): 0 planned · 1 requested · 2 executed
 *   type   (recovery_type):   0 table · 1 beam_on_pile · 2 pile_lowering ·
 *                             3 pile_in_wall · 4 injection · 5 unknown
 *   pileType (pile_type):     0 press · 1 internally_driven · 2 segment
 *   facade  (facade[]):       0 front · 1 sidewall_left · 2 sidewall_right · 3 rear
 */

export interface IRecoverySample {
  id: number
  recovery: number
  building: string
  note: string | null
  status: number | null
  type: number
  pileType: number | null
  facade: number[] | null
  permit: string | null
  permitDate: string | null
  recoveryDate: string | null
  contractor: number | null
  createDate: string | null
  updateDate: string | null
  deleteDate: string | null
}

/** Body for POST/PUT /api/recovery/{id}/sample. */
export interface IRecoverySampleInput {
  /** Address identifier (gfm-* / BAG NUMMERAANDUIDING / BAG PAND); resolved server-side. */
  address: string
  note?: string | null
  status?: number | null
  type: number
  pileType?: number | null
  facade?: number[] | null
  permit?: string | null
  permitDate?: string | null
  recoveryDate?: string | null
  contractor?: number | null
}
