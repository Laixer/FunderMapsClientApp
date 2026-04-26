/**
 * Address shape returned by /api/geocoder/address/:id (snake_case from
 * the geocoder.address table).
 *
 * `id` is the internal `gfm-` identifier. `external_id` is the BAG
 * NUMMERAANDUIDING. `building_id` is the BAG PAND id (used for sample
 * creation — the sample resolves to its building via this).
 */

export interface IAddress {
  id: string
  external_id: string
  building_number: string | null
  postal_code: string | null
  street: string | null
  city: string | null
  building_id: string
}
