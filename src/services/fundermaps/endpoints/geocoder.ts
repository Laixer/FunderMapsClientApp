import { get } from '../client'
import type { IAddress } from '../interfaces/IAddress'

/**
 * Resolve a `gfm-`, `NL.IMBAG.NUMMERAANDUIDING.*`, or `NL.IMBAG.PAND.*`
 * identifier to an Address row. The PDOK suggestion's `id` (a
 * NUMMERAANDUIDING) is the typical input.
 */
export async function getAddress(id: string) {
  return (await get({ endpoint: `/geocoder/address/${id}` })) as IAddress
}

export default { getAddress }
