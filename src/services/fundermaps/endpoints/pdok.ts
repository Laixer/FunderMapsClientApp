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

const NUMMERAANDUIDING_PREFIX = 'NL.IMBAG.NUMMERAANDUIDING.'

/**
 * Resolve a PDOK suggestion id to its BAG NUMMERAANDUIDING. Returns the
 * full `NL.IMBAG.NUMMERAANDUIDING.*` string suitable for our geocoder, or
 * null if PDOK didn't return one.
 *
 * PDOK gives back the bare 16-digit `nummeraanduiding_id`; our geocoder's
 * fromIdentifier() requires the prefixed form to dispatch to NlBagAddress.
 * Without the prefix it tries the 16-char legacy heuristic and 400s.
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
  const bare = body.response?.docs?.[0]?.nummeraanduiding_id
  if (!bare) return null
  return bare.startsWith(NUMMERAANDUIDING_PREFIX) ? bare : NUMMERAANDUIDING_PREFIX + bare
}

export default { suggest, lookupNummeraanduidingId, streetAddresses }

const PDOK_FREE_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free'

export interface IPDOKStreetAddress {
  nummeraanduidingId: string
  label: string
  number: number
  letter: string | null
  addition: string | null
}

/**
 * Every address on one street in one place, for adding a range at once (Don,
 * 2026-09-26: "Oppenheimstraat 5 t/m 23 oneven" meant ten picks by hand).
 * Returns the prefixed BAG NUMMERAANDUIDING, ready for our geocoder.
 */
export async function streetAddresses(street: string, city: string, from: number, to: number): Promise<IPDOKStreetAddress[]> {
  const esc = (s: string) => s.replace(/(["\\])/g, '\\$1')
  const docs: Array<Record<string, unknown>> = []
  // PDOK returns at most 100 rows per call; page through (a long street with letters can pass 100).
  for (let start = 0; start < 1000; start += 100) {
    const url = new URL(PDOK_FREE_URL)
    url.searchParams.set('q', `straatnaam:"${esc(street)}" AND woonplaatsnaam:"${esc(city)}" AND huisnummer:[${from} TO ${to}]`)
    url.searchParams.set('fq', 'type:adres')
    url.searchParams.set('fl', 'nummeraanduiding_id,weergavenaam,huisnummer,huisletter,huisnummertoevoeging')
    url.searchParams.set('rows', '100')
    url.searchParams.set('start', String(start))
    const res = await fetch(url)
    if (!res.ok) throw new Error(`PDOK search failed: ${res.status}`)
    const body = (await res.json()) as { response?: { docs?: Array<Record<string, unknown>>; numFound?: number } }
    const page = body.response?.docs ?? []
    docs.push(...page)
    if (page.length < 100 || docs.length >= (body.response?.numFound ?? 0)) break
  }
  return docs
    .filter((d) => typeof d.nummeraanduiding_id === 'string' && d.huisnummer != null)
    .map((d) => ({
      nummeraanduidingId: NUMMERAANDUIDING_PREFIX + String(d.nummeraanduiding_id),
      label: String(d.weergavenaam ?? ''),
      number: Number(d.huisnummer),
      letter: (d.huisletter as string | undefined) ?? null,
      addition: (d.huisnummertoevoeging as string | undefined) ?? null,
    }))
    .sort((a, b) => a.number - b.number || (a.letter ?? '').localeCompare(b.letter ?? '') || (a.addition ?? '').localeCompare(b.addition ?? ''))
}
