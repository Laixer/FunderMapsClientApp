/**
 * Address shape returned by /api/geocoder/address/:id (snake_case from
 * the geocoder.address table).
 *
 * `id` is the internal `gfm-` identifier. `external_id` is the BAG
 * NUMMERAANDUIDING. `building_id` is the BAG PAND id (used for sample
 * creation — the sample resolves to its building via this).
 *
 * `latitude` / `longitude` are the centroid of the linked building
 * footprint (WGS84). Both are null when the building row is missing
 * or has no geometry — render without a marker, not as 404.
 */

export interface IAddress {
  id: string
  external_id: string
  building_number: string | null
  postal_code: string | null
  street: string | null
  city: string | null
  building_id: string
  /**
   * BAG construction year of the linked pand, as a date (year precision).
   * Null when the building row is missing; BAG itself encodes "unknown" as
   * year 1005 — treat anything before 1100 as unknown. Optional because
   * cached rows from before the API shipped it lack the key.
   */
  built_year?: string | null
  latitude: number | null
  longitude: number | null
}
