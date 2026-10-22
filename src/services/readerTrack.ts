/**
 * The document reader's track record, for a reviewer (2026-10-22).
 *
 * Per field: how often a reviewer took over the value the reader proposed,
 * corrected it, or rejected it (GET /dataops/reader-quality). Shown beside
 * every proposed value on the dossier page, so a field the reader often gets
 * wrong asks for a second look, and as an overview on the Datastroom page.
 *
 * "Overgenomen" includes ranges taken over in one click: it says a person let
 * the value stand, not that every one was checked. Below 20 verdicts a field
 * says nothing: a percentage of five is noise.
 */

import api from '@/services/fundermaps'
import type { IReaderQuality, IReaderTally } from '@/services/fundermaps/interfaces/IDataops'

/** Fewer verdicts than this and a percentage says more about chance than about the reader. */
export const MIN_JUDGED = 20
/** Not taken over this often or more, and the hint asks for attention. */
export const WATCH_RATE = 0.08

let cached: { at: number; data: Promise<IReaderQuality | null> } | null = null

/**
 * The track record, asked at most once every ten minutes: the dossier page
 * opens dossier after dossier, and the numbers move by a handful a day. A
 * failure is null (no hints), never an error on the page that is about the dossier.
 */
export function loadReaderQuality(force = false): Promise<IReaderQuality | null> {
  if (!force && cached && Date.now() - cached.at < 10 * 60_000) return cached.data
  const data = api.dataops.readerQuality().catch(() => null)
  cached = { at: Date.now(), data }
  return data
}

export const missRate = (t: IReaderTally) => (t.judged > 0 ? (t.corrected + t.rejected) / t.judged : 0)

const nl = (n: number) => n.toLocaleString('nl-NL')
const percent = (n: number) => `${Math.round(n * 100)}%`

export interface Track {
  judged: number
  /** Shares of the three outcomes, for the bar. */
  taken: number
  corrected: number
  rejected: number
  /** One line beside the value. */
  text: string
  /** The whole story, for the tooltip and a screen reader. */
  title: string
  watch: boolean
}

/** The hint for one field; null when it has too few verdicts to say anything. */
export function trackFor(quality: IReaderQuality | null, field: string): Track | null {
  const t = quality?.fields.find((f) => f.field === field)
  if (!t || t.judged < MIN_JUDGED) return null
  const miss = missRate(t)
  const watch = miss >= WATCH_RATE
  // "1 op 9" reads at a glance where "11%" has to be weighed.
  const oneIn = miss > 0 ? Math.max(2, Math.round(1 / miss)) : null
  return {
    judged: t.judged,
    taken: t.confirmed / t.judged,
    corrected: t.corrected / t.judged,
    rejected: t.rejected / t.judged,
    // Short: it shares a line with a pill and the model's certainty on half a card.
    text: watch && oneIn ? `1 op ${oneIn} niet overgenomen` : `${percent(t.confirmed / t.judged)} overgenomen`,
    title:
      `Bij dit veld liet een beoordelaar ${nl(t.confirmed)} van de ${nl(t.judged)} waarden van de documentlezer staan` +
      ` (${percent(t.confirmed / t.judged)}); ${nl(t.corrected)} verbeterd, ${nl(t.rejected)} afgewezen.`,
    watch,
  }
}
