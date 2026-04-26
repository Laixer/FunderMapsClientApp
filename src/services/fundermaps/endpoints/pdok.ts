/**
 * PDOK Locatieserver autocomplete + lookup. Hits PDOK directly (not the
 * FunderMaps API), so it bypasses our auth client.
 *
 * Two-step resolution flow:
 *   1. suggest(query) → list of {id, weergavenaam, ...}. The `id` is a
 *      PDOK-internal identifier like `adr-...`, NOT a BAG nummeraanduiding.
 *   2. lookupNummeraanduidingId(suggestion.id) → fetches the canonical BAG
 *      row and returns its `nummeraanduiding_id`
 *      (e.g. `NL.IMBAG.NUMMERAANDUIDING.0599200000123456`).
 *      That's the id our /api/geocoder/address/:id endpoint understands.
 *
 * Sending PDOK's `adr-...` id directly to our geocoder yields a 400
 * "Unsupported address identifier".
 */

import type { IPDOKSuggestion, IPDOKSuggestionResponse } from '../interfaces/IPDOKSuggestion'

const PDOK_SUGGEST_URL =
  'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest'
const PDOK_LOOKUP_URL =
  'https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup'

export async function suggest(query: string, rows = 10): Promise<IPDOKSuggestion[]> {
  if (!query.trim()) return []
  const url = new URL(PDOK_SUGGEST_URL)
  url.searchParams.set('fq', 'type:adres')
  url.searchParams.set('q', query)
  url.searchParams.set('rows', String(rows))

  const res = await fetch(url)
  if (!res.ok) throw new Error(`PDOK suggest failed: ${res.status}`)
  const body: IPDOKSuggestionResponse = await res.json()
  return body.response?.docs ?? []
}

interface IPDOKLookupResponse {
  response: {
    docs: Array<{
      nummeraanduiding_id?: string
      pand_id?: string
      [key: string]: unknown
    }>
  }
}

/**
 * Resolve a PDOK suggestion id to its BAG NUMMERAANDUIDING. Returns the
 * full `NL.IMBAG.NUMMERAANDUIDING.*` string suitable for our geocoder, or
 * null if PDOK didn't return one.
 */
export async function lookupNummeraanduidingId(
  pdokId: string,
): Promise<string | null> {
  const url = new URL(PDOK_LOOKUP_URL)
  url.searchParams.set('id', pdokId)
  url.searchParams.set('fl', '*')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`PDOK lookup failed: ${res.status}`)
  const body: IPDOKLookupResponse = await res.json()
  return body.response?.docs?.[0]?.nummeraanduiding_id ?? null
}

export default { suggest, lookupNummeraanduidingId }
