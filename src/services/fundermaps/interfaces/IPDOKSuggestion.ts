/**
 * Address suggestion from PDOK Locatieserver autocomplete.
 *
 * The user picks a suggestion → ClientApp passes `id` (a BAG
 * NUMMERAANDUIDING like `NL.IMBAG.NUMMERAANDUIDING.0599200000123456`)
 * to `geocoder.getAddress(id)` to resolve the canonical row.
 */

export interface IPDOKSuggestion {
  id: string
  type: string
  weergavenaam: string
  score: number
}

export interface IPDOKSuggestionResponse {
  response: {
    docs: IPDOKSuggestion[]
    numFound: number
  }
}
