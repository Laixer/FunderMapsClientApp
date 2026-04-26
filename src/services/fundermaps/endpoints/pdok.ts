/**
 * PDOK Locatieserver autocomplete. Hits PDOK directly (not the FunderMaps API),
 * so it bypasses our auth client. Returns up to `rows` address suggestions
 * keyed on the user's typed query.
 */

import type { IPDOKSuggestion, IPDOKSuggestionResponse } from '../interfaces/IPDOKSuggestion'

const PDOK_SUGGEST_URL =
  'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest'

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

export default { suggest }
