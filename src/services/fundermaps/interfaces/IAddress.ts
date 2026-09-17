/**
 * Address shape returned by /api/geocoder/address/:id (snake_case from
 * the geocoder.address table).
 *
 * `external_id` is the BAG NUMMERAANDUIDING and the id to send to the API
 * for a picked address. `id` is the internal `gfm-` surrogate; samples and
 * dossier rows still carry it, so it is echoed where the API handed it out,
 * but never sent for a new pick (its retirement is Worker #158).
 * `building_id` is the BAG PAND id (used for recovery samples, which key on
 * the pand).
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
